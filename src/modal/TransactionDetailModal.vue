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
				<button @click="mode = 'summary'" :class="summaryClasses('summary')">{{ translate('summary') }}</button>
				<button @click="mode = 'outputs'" :class="summaryClasses('outputs')">{{ translate('outputs') }}</button>
			</div>
			<div class="transaction-mode">
				<transition name="fade-top" mode="out-in">
					<transaction-outputs
						:transaction="transaction"
						key="outputs"
						v-if="mode === 'outputs'" />
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
				<div class="transaction-data-label">{{ translate('total') }}</div>
				<div class="transaction-data" v-html="siacoinDisplay(transaction.siacoin_value.value)" />
				<div class="transaction-data" v-html="currencyDisplay(transaction.siacoin_value.value)" />
			</div>
		</div>
	</modal>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString } from '@/utils/format';

import Modal from './Modal';
import TransactionOutputs from '@/components/transactions/TransactionOutputs';
import TransactionSummary from '@/components/transactions/TransactionSummary';

export default {
	components: {
		Modal,
		TransactionOutputs,
		TransactionSummary
	},
	props: {
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'feeAddresses']),
		apiFees() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return new BigNumber(0);

			return this.transaction.siacoin_outputs.reduce((v, o) =>
				this.feeAddresses.indexOf(o.unlock_hash) ? v : v.plus(o.value), new BigNumber(0));
		},
		fees() {
			return new BigNumber(this.transaction.fees).plus(this.apiFees);
		}
	},
	data() {
		return {
			mode: 'summary'
		};
	},
	methods: {
		siacoinDisplay(value) {
			const siacoins = formatPriceString(new BigNumber(value), 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		currencyDisplay(value) {
			const currency = formatPriceString(new BigNumber(value), 2, this.currency, this.exchangeRateSC[this.currency]);

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

			switch (this.transaction.tags[0]) {
			case 'contract_revision':
				return this.translate('transactionTypes.contractRevision');
			case 'contract_formation':
				return this.translate('transactionTypes.contractFormation');
			case 'storage_proof':
				return this.translate('transactionTypes.storageProof');
			case 'host_announcements':
				return this.translate('transactionTypes.hostAnnouncement');
			case 'contract_valid_output':
			case 'contract_missed_output':
				return this.translate('transactionTypes.contractCompleted');
			case 'block_reward':
				return this.translate('transactionTypes.blockReward');
			case 'siacoin_transaction':
				return this.translate('transactionTypes.siacoinTransaction');
			case 'siafund_transaction':
				return this.translate('transactionTypes.siafundTransaction');
			case 'siafund_claim':
				return this.translate('transactionTypes.siafundClaim');
			case 'defrag':
				return this.translate('transactionTypes.defrag');
			default:
				return this.transaction.tags[0];
			}
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
</style>