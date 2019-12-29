<template>
	<div class="transaction-verify">
		<h2 class="text-center">Verify Transaction</h2>
		<div class="summary-type">
			<button @click="mode = 'summary'" :class="getSummaryClasses('summary')">Summary</button>
			<button @click="mode = 'outputs'" :class="getSummaryClasses('outputs')">Outputs</button>
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
		<transition name="fade" mode="out-in" appear>
			<sign-ledger-transaction
				v-if="wallet.type === 'ledger' && !transactionSigned"
				class="ledger-sign"
				:transaction="siaTransaction"
				:requiredSignatures="requiredSignatures"
				@signed="onLedgerSigned" />
			<div v-else-if="sending" :key="status">{{ status }}</div>
			<div class="buttons" v-else key="send">
				<button class="btn btn-success btn-inline" :disabled="sending" @click="onVerifyTxn">Send</button>
			</div>
		</transition>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { signTransaction } from '@/utils/sia';
import { scanTransactions } from '@/sync/scanner';
import { broadcastTransaction } from '@/api/siacentral';

import SignLedgerTransaction from '@/components/ledger/SignLedgerTransaction';
import TransactionSummary from '@/components/transaction/TransactionSummary';
import TransactionOutputs from '@/components/transaction/TransactionOutputs';
import TransactionTotals from '@/components/transaction/TransactionTotals';

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
		...mapState(['currency', 'currencies', 'networkFees']),
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
		...mapActions(['saveWallet']),
		getSummaryClasses(mode) {
			return {
				'btn': true,
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
			}
		},
		async onVerifyTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				this.status = 'Signing transaction...';

				switch (this.wallet.type) {
				case 'ledger':
					if (!this.signed)
						throw new Error('transaction not signed');
					break;
				case 'default':
					this.signed = await signTransaction(this.wallet.seed,
						this.siaTransaction, this.requiredSignatures);
					break;
				default:
					throw new Error('unsupported wallet type');
				}

				this.status = 'Broadcasting transaction...';

				await broadcastTransaction({
					siacoininputs: this.signed.siacoininputs,
					siacoinoutputs: this.signed.siacoinoutputs,
					minerfees: this.signed.minerfees,
					transactionsignatures: this.signed.transactionsignatures
				});
				await scanTransactions(this.wallet);

				this.status = 'Transaction sent...';
				this.$emit('done');
			} catch (ex) {
				console.error('onVerifyTxn', ex);
				this.status = ex.message;
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
		padding: 15px;
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

.buttons {
	text-align: center;
}
</style>