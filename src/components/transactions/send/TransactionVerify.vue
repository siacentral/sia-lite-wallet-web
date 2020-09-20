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
				:transaction="siaTransaction"
				:requiredSignatures="requiredSignatures"
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
import { signTransaction } from '@/sia';
import { scanTransactions } from '@/sync/scanner';
import { siaAPI, scprimeAPI } from '@/api/siacentral';
import WalrusClient from '@/api/walrus';

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
		...mapState(['currency', 'exchangeRateSC', 'siaNetworkFees', 'scprimeNetworkFees']),
		networkFees() {
			if (this.wallet && this.wallet.currency === 'scp')
				return this.scprimeNetworkFees;

			return this.siaNetworkFees;
		},
		siaTransaction() {
			return {
				minerfees: this.transaction.miner_fees,
				siacoininputs: this.transaction.siacoin_inputs.map(i => ({
					parentid: i.output_id,
					unlockconditions: i.unlock_conditions
				})),
				siacoinoutputs: this.transaction.siacoin_outputs.map(o => ({
					unlockhash: o.unlock_hash,
					value: o.value
				})),
				transactionsignatures: this.transaction.siacoin_inputs.map(i => ({
					parentid: i.output_id,
					coveredfields: { wholetransaction: true }
				}))
			};
		},
		remStr() {
			const format = formatPriceString(this.remainder, 2);

			return `${format.value} <span class="currency-display">${format.label}</div>`;
		},
		remainder() {
			const input = this.transaction.siacoin_inputs.reduce((v, i) => v.plus(i.value), new BigNumber(0));
			let output = this.transaction.siacoin_outputs.reduce((v, o) => v.plus(o.value), new BigNumber(0));

			output = output.plus(this.transaction.miner_fees.reduce((v, f) => v.plus(f), new BigNumber(0)));

			return output.minus(input).abs();
		},
		valid() {
			return this.remainder.eq(0);
		},
		requiredSignatures() {
			return this.transaction.siacoin_inputs.map(i => i.index);
		},
		spentOutputs() {
			if (!this.data || !this.transaction)
				return [];

			return this.transaction.siacoininputs.map(a => a.parentid);
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
			switch (this.wallet.server_type) {
			case 'walrus':
				return new WalrusClient(this.wallet.server_url).broadcastTransaction(txnset.map(txn => ({
					siacoinInputs: txn.siacoininputs,
					siacoinOutputs: txn.siacoinoutputs,
					minerFees: txn.minerfees,
					transactionSignatures: txn.transactionsignatures
				})));
			default:
				switch (this.wallet.currency) {
				case 'scp':
					return scprimeAPI.broadcastTransaction(txnset);
				default:
					return siaAPI.broadcastTransaction(txnset);
				}
			}
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
					this.signed = await signTransaction(this.wallet.seed, this.wallet.currency,
						this.siaTransaction, this.requiredSignatures);
					break;
				default:
					throw new Error('unsupported wallet type');
				}

				this.status = this.translate('sendSiacoinsModal.statusBroadcasting', 0, 1);

				await this.broadcastTxnset([{
					siacoininputs: this.signed.siacoininputs,
					siacoinoutputs: this.signed.siacoinoutputs,
					minerfees: this.signed.minerfees,
					transactionsignatures: this.signed.transactionsignatures
				}]);

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