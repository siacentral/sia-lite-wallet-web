<template>
	<modal @close="$emit('close')">
		<div class="transaction-detail">
			<div class="transaction-extras">
				<template v-if="transaction.transaction_id.indexOf('nontxn-') === -1">
					<div class="transaction-data-label">Transaction ID</div>
					<div />
					<div class="transaction-data">{{ transaction.transaction_id }}</div>
				</template>
				<div class="transaction-data-label">Source</div>
				<div />
				<div class="transaction-data">{{ friendlyType(transaction) }}</div>
			</div>
			<div class="summary-type">
				<button v-if="showSummary" @click="mode = 'summary'" :class="summaryClasses('summary')">{{ translate('summary') }}</button>
				<button @click="mode = 'outputs'" :class="summaryClasses('outputs')">{{ translate('outputs') }}</button>
				<button @click="mode = 'siafundOutputs'" :class="summaryClasses('siafundOutputs')">{{ translate('siafundOutputs') }}</button>
			</div>
			<div class="transaction-mode">
				<transition name="fade-top" mode="out-in">
					<transaction-siafund-outputs
						:transaction="transaction"
						key="siafundOutputs"
						v-if="mode === 'siafundOutputs'" />
					<transaction-outputs
						:transaction="transaction"
						key="outputs"
						v-else-if="mode === 'outputs'" />
					<transaction-summary
						:transaction="transaction"
						key="summary"
						v-else />
				</transition>
			</div>
			<div class="transaction-extras">
				<div class="divider" />
				<template v-if="fees.gt(0) && transaction.direction === 'sent'">
					<div class="transaction-data-label">{{ translate('transactionFee') }}</div>
					<div class="transaction-data" v-html="siacoinDisplay(fees)" />
					<div class="transaction-data" v-html="currencyDisplay(fees)" />
				</template>
				<div class="transaction-data-label">{{ translate('siacoinTotal') }}</div>
				<div class="transaction-data" v-html="siacoinDisplay(transaction.siacoin_value.value)" />
				<div class="transaction-data" v-html="currencyDisplay(transaction.siacoin_value.value)" />
				<template v-if="showSiafunds">
					<div class="transaction-data-label">{{ translate('siafundTotal') }}</div>
					<div class="transaction-data" v-html="siafundDisplay(transaction.siafund_value.value)" />
					<div class="transaction-data" v-html="siafundCurrencyDisplay(transaction.siafund_value.value)" />
				</template>
			</div>
		</div>
	</modal>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString, formatSiafundString } from '@/utils/format';

import Modal from './Modal';
import TransactionOutputs from '@/components/transactions/TransactionOutputs';
import TransactionSiafundOutputs from '@/components/transactions/TransactionSiafundOutputs';
import TransactionSummary from '@/components/transactions/TransactionSummary';

export default {
	components: {
		Modal,
		TransactionOutputs,
		TransactionSiafundOutputs,
		TransactionSummary
	},
	props: {
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSF', 'feeAddresses']),
		apiFees() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return new BigNumber(0);

			return this.transaction.siacoin_outputs.reduce((v, o) =>
				this.feeAddresses.indexOf(o.unlock_hash) ? v : v.plus(o.value), new BigNumber(0));
		},
		fees() {
			return new BigNumber(this.transaction.fees).plus(this.apiFees);
		},
		showSiafunds() {
			return this.transaction && Array.isArray(this.transaction.siafund_inputs) && this.transaction.siafund_inputs.length > 0;
		},
		showSummary() {
			return Array.isArray(this.transaction.siacoin_outputs) && this.transaction.siacoin_outputs.length !== 0;
		},
		defaultMode() {
			if (!this.transaction)
				return 'summary';

			if (Array.isArray(this.transaction.siafund_outputs) && this.transaction.siafund_outputs.length !== 0)
				return 'siafundOutputs';

			if (!Array.isArray(this.transaction.siacoin_outputs) || this.transaction.siacoin_outputs.length === 0)
				return 'outputs';

			return 'summary';
		}
	},
	data() {
		return {
			mode: 'summary'
		};
	},
	beforeMount() {
		this.mode = this.defaultMode;
	},
	methods: {
		siacoinDisplay(value) {
			const siacoins = formatPriceString(new BigNumber(value), 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		siafundDisplay(value) {
			const siafunds = formatSiafundString(new BigNumber(value), 2);

			return `${siafunds.value} <span class="currency-display">${this.translate('currency.sf')}</span>`;
		},
		currencyDisplay(value) {
			const currency = formatPriceString(new BigNumber(value), 2, this.currency, this.exchangeRateSC[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		siafundCurrencyDisplay(value) {
			const currency = formatPriceString(new BigNumber(value).times(1e24), 2, this.currency, this.exchangeRateSF[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		summaryClasses(mode) {
			return {
				'btn': true,
				'btn-inline': true,
				'btn-enabled': mode === this.mode
			};
		},
		friendlyType(txn) {
			if (!this.transaction || !Array.isArray(this.transaction.tags))
				return this.translate('transactionTypes.siacoinTransaction');

			if (this.transaction.tags.indexOf('contract_revision') !== -1)
				return this.translate('transactionTypes.contractRevision');
			else if (this.transaction.tags.indexOf('contract_formation') !== -1)
				return this.translate('transactionTypes.contractFormation');
			else if (this.transaction.tags.indexOf('storage_proof') !== -1)
				return this.translate('transactionTypes.storageProof');
			else if (this.transaction.tags.indexOf('host_announcement') !== -1)
				return this.translate('transactionTypes.hostAnnouncement');
			else if (this.transaction.tags.indexOf('contract_valid_output') !== -1 || this.transaction.tags.indexOf('contract_missed_output') !== -1)
				return this.translate('transactionTypes.contractCompleted');
			else if (this.transaction.tags.indexOf('block_reward') !== -1)
				return this.translate('transactionTypes.blockReward');
			else if (this.transaction.tags.indexOf('siacoin_transaction') !== -1)
				return this.translate('transactionTypes.siacoinTransaction');
			else if (this.transaction.tags.indexOf('siafund_transaction') !== -1)
				return this.translate('transactionTypes.siafundTransaction');
			else if (this.transaction.tags.indexOf('siafund_claim') !== -1)
				return this.translate('transactionTypes.siafundClaim');
			else if (this.transaction.tags.indexOf('defrag') !== -1)
				return this.translate('transactionTypes.defrag');

			return this.transaction.tags[0];
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-detail {
	display: grid;
	width: 100%;
	height: 100%;
	grid-gap: 15px;
	align-content: safe center;
	overflow: hidden;
}

.transaction-mode {
	background: bg-dark;
	border-radius: 4px;
	overflow-x: hidden;
	overflow-y: auto;
}

.transaction-extras {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	width: 100%;
	height: 100%;
	grid-gap: 15px;
	align-content: safe center;
	overflow: hidden;

	.divider {
		height: 1px;
		background: dark-gray;
		grid-column: 1 / -1;
	}

	.transaction-data-label, .transaction-data {
		white-space: nowrap;
	}

	.transaction-data {
		text-align: right;
		text-overflow: ellipsis;
		overflow: hidden;
	}
}

.summary-type {
	.btn {
		opacity: 0.6;

		&.btn-enabled {
			opacity: 1;
		}
	}
}
</style>