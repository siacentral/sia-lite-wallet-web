<template>
	<tr :class="transactionClass" @click="$emit('click')">
		<td class="transaction-type fit-text">{{ displayType }}</td>
		<td class="transaction-spacer" />
		<td class="transaction-confirms fit-text"><span>{{ displayConfirmations }}</span></td>
		<td class="transaction-amount fit-text">
			<div :class="siacoinClass" v-html="displaySiacoins"/>
			<div class="transaction-currency" v-html="displayCurrency" />
			<div :class="siafundClass" v-if="showSiafunds" v-html="displaySiafunds"/>
		</td>
	</tr>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { formatPriceString, formatSiafundString } from '@/utils/format';

export default {
	props: {
		wallet: Object,
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
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
		showSiafunds() {
			return this.transaction && Array.isArray(this.transaction.siafund_inputs) && this.transaction.siafund_inputs.length > 0;
		},
		displaySiacoins() {
			const format = formatPriceString(this.siacoinAmount, 2, this.wallet.currency, 1, this.wallet.precision());

			if (this.transaction.siacoin_value.direction === 'sent' && !new BigNumber(this.transaction.siacoin_value.value).eq(0))
				return `-${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		displaySiafunds() {
			const format = formatSiafundString(this.siafundAmount);

			if (this.transaction.siafund_value.direction === 'sent' && !new BigNumber(this.transaction.siafund_value.value).eq(0))
				return `-${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		displayCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const format = formatPriceString(this.siacoinAmount, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			if (this.transaction.siacoin_value.direction === 'sent')
				return `-${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		displayType() {
			if (!this.transaction || !Array.isArray(this.transaction.tags)) {
				if (this.wallet.currency === 'scp')
					return this.translate('transactionTypes.scprimeTransaction');

				return this.translate('transactionTypes.siacoinTransaction');
			}

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
			else if (this.transaction.tags.indexOf('siacoin_transaction') !== -1) {
				if (this.wallet.currency === 'scp')
					return this.translate('transactionTypes.scprimeTransaction');

				return this.translate('transactionTypes.siacoinTransaction');
			} else if (this.transaction.tags.indexOf('siafund_transaction') !== -1)
				return this.translate('transactionTypes.siafundTransaction');
			else if (this.transaction.tags.indexOf('siafund_claim') !== -1)
				return this.translate('transactionTypes.siafundClaim');
			else if (this.transaction.tags.indexOf('defrag') !== -1)
				return this.translate('transactionTypes.defrag');

			return this.transaction.tags[0];
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

			if (this.transaction && this.transaction.siafund_value)
				classes[`value-${this.transaction.siafund_value.direction}`] = true;

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