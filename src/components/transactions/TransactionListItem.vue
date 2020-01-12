<template>
	<tr :class="transactionClass" @click="$emit('click')">
		<td class="transaction-type fit-text">{{ displayType }}</td>
		<td class="transaction-spacer" />
		<td class="transaction-confirms fit-text"><span>{{ displayConfirmations }}</span></td>
		<td class="transaction-amount fit-text">
			<div :class="siacoinClass" v-html="displaySiacoins"/>
			<!--<div :class="siafundClass" v-if="siafundAmount.gt(0)" v-html="displaySiafunds"/>-->
			<div class="transaction-currency" v-html="displayCurrency" />
		</td>
	</tr>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { formatPriceString, formatSiafundString } from '@/utils/format';

export default {
	props: {
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC']),
		siacoinAmount() {
			if (!this.transaction || !this.transaction.siacoin_value)
				return new BigNumber(0);

			let value = new BigNumber(this.transaction.siacoin_value.value);

			if (value.isNaN() || !value.isFinite())
				value = new BigNumber(0);

			return value;
		},
		siafundAmount() {
			if (!this.transaction || !this.transaction.siafund_value)
				return new BigNumber(0);

			let value = new BigNumber(this.transaction.siafund_value.value);

			if (value.isNaN() || !value.isFinite())
				value = new BigNumber(0);

			return value;
		},
		displaySiacoins() {
			const format = formatPriceString(this.siacoinAmount, 2);

			if (this.transaction.siacoin_value.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		displaySiafunds() {
			const format = formatSiafundString(this.siafundAmount);

			if (this.transaction.siafund_value.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		displayCurrency() {
			const format = formatPriceString(this.siacoinAmount, 2, this.currency, this.exchangeRateSC[this.currency]);

			if (this.transaction.siacoin_value.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		displayType() {
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
		},
		displayConfirmations() {
			if (this.transaction && this.transaction.confirmations === 0)
				return this.translate('unconfirmed');

			return '';
		},
		transactionClass() {
			const classes = {};

			if (this.transaction && this.transaction.confirmations === 0)
				classes['transaction-unconfirmed'] = true;

			return classes;
		},
		siacoinClass() {
			const classes = {};

			if (this.transaction && this.transaction.siacoin_value)
				classes[`value-${this.transaction.siacoin_value.direction}`] = true;

			return classes;
		},
		siafundClass() {
			const classes = {};

			if (this.transaction && this.transaction.siacoin_value)
				classes[`value-${this.transaction.siacoin_value.direction}`] = true;

			return classes;
		}
	}
};
</script>

<style lang="stylus" scoped>
.value-received {
	color: primary;
}

.transaction-confirms span {
	display: none;
	padding: 2px 4px;
	background: dark-gray;
	border-radius: 4px;
	color: rgba(255, 255, 255, 0.54);
	font-size: 0.85rem;
	text-align: center;
}

.transaction-unconfirmed {
	opacity: 0.45;

	.transaction-confirms span {
		display: inline-block;
	}
}

tr {
	color: rgba(255, 255, 255, 0.54);
	background: bg-dark;

	td {
		border-bottom: 1px solid bg-dark-accent;
		padding: 15px;
	}

	&:hover, &:focus, &:active {
		background: bg-dark-accent;
		cursor: pointer;
	}
}

.transaction-amount, .transaction-currency, .transaction-type {
	text-align: right;
}

.transaction-amount {
	font-size: 1.3rem;
}

.transaction-currency {
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.54);
}

.transaction-spacer {
	width: 100%;
}

.transaction-type {
	text-align: left;
}
</style>