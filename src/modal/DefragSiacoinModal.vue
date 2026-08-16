<template>
		<modal @close="$emit('close')">
			<p class="text-warning">{{ translate('defragModal.defragExplain') }}</p>
			<transition name="fade-top" mode="out-in">
				<defrag-setup :wallet="wallet" v-if="step === 'setup'" key="setup" @built="onTransactionsBuilt" />
				<div v-else-if="wallet.type === 'ledger'" key="ledger">
					<div class="text-center defrag-progress" v-if="step === 'sending'">{{ status }}</div>
					<sign-ledger-transaction
						:transaction="currentSiaTransaction"
						:requiredSignatures="currentRequiredSignatures"
						:changeIndex="currentChangeIndex"
						@signed="onLedgerSigned" />
				</div>
				<div v-else class="text-center" :key="status">{{ status }}</div>
			</transition>
		</modal>
</template>

<script>
import Modal from './Modal';
import DefragSetup from '@/components/transactions/send/DefragSetup';
import SignLedgerTransaction from '@/components/ledger/SignLedgerTransaction';
import { v2SignTransaction } from '@/sia';
import { scanTransactions } from '@/sync/scanner';
import { broadcastTransaction } from '@/api/siacentral';

function toSiaTransaction(txn) {
	return {
		minerFee: txn.minerFees[0],
		siacoinInputs: txn.siacoinInputs.map(i => ({
			parent: {
				id: i.parentID
			},
			satisfiedPolicy: {
				policy: {
					type: 'uc',
					policy: i.unlockConditions
				}
			},
			value: i.value,
			index: i.index
		})),
		siacoinOutputs: txn.siacoinOutputs
	};
}

export default {
	emits: ['close'],
	components: {
		Modal,
		DefragSetup,
		SignLedgerTransaction
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			step: 'setup',
			status: '',
			sending: false,
			transactions: [],
			currentIndex: 0
		};
	},
	computed: {
		currentSiaTransaction() {
			return toSiaTransaction(this.transactions[this.currentIndex]);
		},
		currentRequiredSignatures() {
			return this.currentSiaTransaction.siacoinInputs.map(i => i.index);
		},
		currentChangeIndex() {
			return this.transactions[this.currentIndex]?.changeIndex || 0;
		}
	},
	methods: {
		async onTransactionsBuilt({ transactions }) {
			if (this.sending)
				return;

			this.transactions = transactions;
			this.currentIndex = 0;

			switch (this.wallet.type) {
			case 'ledger':
				this.step = 'signing';
				break;
			case 'default':
				await this.sendDefault();
				break;
			default:
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: 'unsupported wallet type'
				});
			}
		},
		async sendDefault() {
			try {
				this.sending = true;
				this.step = 'sending';

				for (let i = 0; i < this.transactions.length; i++) {
					const siaTxn = toSiaTransaction(this.transactions[i]),
						requiredSignatures = siaTxn.siacoinInputs.map(input => input.index);

					this.status = this.translate('sendSiacoinsModal.statusSigning');
					const signed = await v2SignTransaction(this.wallet.seed, siaTxn, requiredSignatures);

					this.status = this.translate('sendSiacoinsModal.statusBroadcasting', i + 1, this.transactions.length);
					await broadcastTransaction(null, [signed]);
				}

				await this.onComplete();
			} catch (ex) {
				console.error('DefragSiacoinModal.sendDefault', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: ex.message
				});
				// rescan before rebuilding so the retry sees the transactions
				// that were already broadcast and skips their outputs
				await scanTransactions(this.wallet).catch(() => {});
				this.step = 'setup';
			} finally {
				this.sending = false;
			}
		},
		async onLedgerSigned(signed) {
			if (this.sending)
				return;

			try {
				this.sending = true;
				this.step = 'sending';
				this.status = this.translate('sendSiacoinsModal.statusBroadcasting', this.currentIndex + 1, this.transactions.length);

				await broadcastTransaction(null, [signed]);

				if (this.currentIndex + 1 >= this.transactions.length) {
					await this.onComplete();
					return;
				}

				this.currentIndex++;
				this.step = 'signing';
			} catch (ex) {
				console.error('DefragSiacoinModal.onLedgerSigned', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: ex.message
				});
				this.step = 'signing';
			} finally {
				this.sending = false;
			}
		},
		async onComplete() {
			this.status = 'Transactions sent! Updating balance...';
			this.pushNotification({
				icon: 'wallet',
				message: this.translate('alerts.transactionBroadcast')
			});

			await scanTransactions(this.wallet);

			this.$emit('close');
		}
	}
};
</script>

<style lang="stylus" scoped>
p {
	margin-bottom: 30px;
}

.defrag-progress {
	color: rgba(255, 255, 255, 0.54);
	margin-bottom: 15px;
}
</style>
