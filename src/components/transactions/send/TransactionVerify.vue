<template>
	<div class="transaction-verify">
		<h2 class="text-center">Verify Transaction</h2>
		<div class="summary-type">
			<button @click="mode = 'summary'" :class="getSummaryClasses('summary')">{{ translate('summary') }}</button>
			<button @click="mode = 'outputs'" :class="getSummaryClasses('outputs')">{{ translate('outputs') }}</button>
		</div>
		<div class="transaction-detail">
			<transition name="fade-top" mode="out-in" appear>
				<transaction-outputs
					:transaction="transaction"
					:wallet="wallet"
					key="outputs"
					v-if="mode === 'outputs'" />
				<transaction-summary
					:transaction="transaction"
					:wallet="wallet"
					key="summary"
					v-else />
			</transition>
		</div>
		<transaction-totals :transaction="transaction" :wallet="wallet" :mode="mode" />
		<transition name="fade" mode="out-in">
			<sign-ledger-transaction
				v-if="wallet.type === 'ledger' && !transactionSigned"
				class="ledger-sign"
				:currency="wallet.currency"
				:transaction="siaTransaction"
				:requiredSignatures="requiredSignatures"
				:changeIndex="changeIndex"
				@signed="onLedgerSigned" />
			<div v-else-if="sending" :key="status">{{ status }}</div>
			<div v-else-if="!valid" :key="valid" class="text-danger">Transaction is not valid, would burn <template v-html="remStr" /></div>
			<div class="buttons" v-else key="send">
				<button class="btn btn-success btn-inline" :disabled="sending" @click="onVerifyTxn">{{ translate('send') }}</button>
			</div>
		</transition>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { formatPriceString } from '@/utils/format';
import { mapState } from 'vuex';
import { v2SignTransaction } from '@/sia';
import { scanTransactions } from '@/sync/scanner';
import { broadcastTransaction } from '@/api/siacentral';

import SignLedgerTransaction from '@/components/ledger/SignLedgerTransaction';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import TransactionOutputs from '@/components/transactions/TransactionOutputs';
import TransactionTotals from '@/components/transactions/send/TransactionTotals';

export default {
	components: {
		SignLedgerTransaction,
		TransactionOutputs,
		TransactionSummary,
		TransactionTotals
	},
	props: {
		wallet: Object,
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'siaNetworkFees']),
		networkFees() {
			return this.siaNetworkFees;
		},
		siaTransaction() {
			return {
				minerFee: this.transaction.minerFees[0],
				siacoinInputs: this.transaction.siacoinInputs.map(i => ({
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
				siacoinOutputs: this.transaction.siacoinOutputs,
				siafundInputs: (this.transaction.siafundInputs || []).map(i => ({
					parent: {
						id: i.parentID
					},
					satisfiedPolicy: {
						policy: {
							type: 'uc',
							policy: i.unlockCondtions
						}
					},
					value: i.value,
					index: i.index
				})),
				siafundOutputs: this.transaction.siafundOutputs
			};
		},
		changeIndex() {
			return this.transaction?.changeIndex || 0;
		},
		remStr() {
			const format = formatPriceString(this.remainder, 2);

			return `${format.value} <span class="currency-display">${format.label}</div>`;
		},
		remainder() {
			const input = this.transaction.siacoinInputs.reduce((v, i) => v.plus(i.value), new BigNumber(0));
			let output = this.transaction.siacoinOutputs.reduce((v, o) => v.plus(o.value), new BigNumber(0));

			output = output.plus(this.transaction.minerFees.reduce((v, f) => v.plus(f), new BigNumber(0)));

			return output.minus(input).abs();
		},
		valid() {
			return this.remainder.eq(0);
		},
		requiredSignatures() {
			return this.siaTransaction.siacoinInputs.map(i => i.index).concat(
				(this.siaTransaction.siafundInputs || []).map(i => i.index));
		},
		spentOutputs() {
			if (!this.data || !this.transaction)
				return [];

			return this.transaction.siacoinInputs.map(a => a.parent.id);
		},
		spentSFOutputs() {
			if (!this.data || !this.transaction)
				return [];

			return this.transaction.siafundInputs.map(a => a.parent.id);
		}
	},
	data() {
		return {
			mode: 'summary',
			sending: false,
			transactionSigned: false,
			signed: null,
			status: null
		};
	},
	methods: {
		getSummaryClasses(mode) {
			return {
				btn: true,
				'btn-inline': true,
				'btn-enabled': mode === this.mode
			};
		},
		async onLedgerSigned(signed) {
			try {
				this.signed = signed;
				this.transactionSigned = true;
			} catch (ex) {
				console.error('onLedgerSigned', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
			}
		},
		broadcastTxnset(txnset) {
			return broadcastTransaction(null, txnset);
		},
		async onVerifyTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				this.status = this.translate('sendSiacoinsModal.statusSigning');

				switch (this.wallet.type) {
				case 'ledger':
					if (!this.signed)
						throw new Error('transaction not signed');
					break;
				case 'default':
					console.log(JSON.stringify(this.siaTransaction, null, 2));
					this.signed = await v2SignTransaction(this.wallet.seed, this.siaTransaction, this.requiredSignatures);
					break;
				default:
					throw new Error('unsupported wallet type');
				}

				this.status = this.translate('sendSiacoinsModal.statusBroadcasting', 0, 1);

				await this.broadcastTxnset([this.signed]);

				this.status = 'Transaction sent! Updating balance...';
				this.pushNotification({
					icon: 'wallet',
					message: this.translate('alerts.transactionBroadcast')
				});

				await scanTransactions(this.wallet);

				this.$emit('done');
			} catch (ex) {
				console.error('onVerifyTxn', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: ex.message
				});
			} finally {
				this.sending = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-verify {
	display: grid;
	height: 100%;
	grid-template-rows: repeat(2, auto) minmax(0, 1fr) auto;
	align-content: safe center;
	grid-gap: 15px;
	overflow: hidden;

	.transaction-detail {
		overflow-x: hidden;
		overflow-y: auto;
		background: bg-dark;
		border-radius: 4px;
	}
}

h2 {
	color: rgba(255, 255, 255, 0.54);
	margin: 0 0 45px;
}

.summary-type {
	button {
		opacity: 0.54;
		transition: all 0.3s linear;

		&.btn-enabled {
			opacity: 1;
		}
	}
}

.identifier {
	width: 100px;
	margin: auto auto 30px;

	svg {
		width: 100%;
		height: 100%;
		border-radius: 4px;
	}
}
</style>