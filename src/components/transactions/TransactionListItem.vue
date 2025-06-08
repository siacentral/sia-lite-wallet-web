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
			const siacoinInput = new BigNumber(this.transaction?.siacoin_inputs || 0),
				siacoinOutput = new BigNumber(this.transaction?.siacoin_outputs || 0);

			return siacoinOutput.minus(siacoinInput);
		},
		siafundAmount() {
			const siafundInput = new BigNumber(this.transaction?.siafund_inputs || 0),
				siafundOutput = new BigNumber(this.transaction?.siafund_outputs || 0);

			return siafundOutput.minus(siafundInput);
		},
		showSiafunds() {
			return this.siafundAmount.gt(0);
		},
		displaySiacoins() {
			const format = formatPriceString(this.siacoinAmount.abs(), 2, this.wallet.currency, 1);

			if (this.siacoinAmount.lt(0))
				return `-${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		displaySiafunds() {
			const format = formatSiafundString(this.siafundAmount, this.wallet.currency);

			if (this.siafundAmount.lt(0))
				return `-${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		displayCurrency() {
			const exchangeRate = this.exchangeRateSC[this.currency],
				label = this.currency;

			const format = formatPriceString(this.siacoinAmount.abs(), 2, label, exchangeRate, this.wallet.precision());
			let display = `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;

			const neg = this.siacoinAmount.lt(0);
			if (neg)
				display = '-' + display;

			return display;
		},
		displayType() {
			if (!this.transaction || !Array.isArray(this.transaction.tags)) {
				if (this.wallet.currency === 'scp')
					return this.translate('transactionTypes.scprimeTransaction');

				return this.translate('transactionTypes.siacoinTransaction');
			}

			if (this.transaction.tags.indexOf('contract_renewal') !== -1)
				return this.translate('transactionTypes.contractRenewal');
			else if (this.transaction.tags.indexOf('contract_revision') !== -1)
				return this.translate('transactionTypes.contractRevision');
			else if (this.transaction.tags.indexOf('contract_formation') !== -1)
				return this.translate('transactionTypes.contractFormation');
			else if (this.transaction.tags.indexOf('contract_renewal') !== -1)
				return 'Contract Renewal';
			else if (this.transaction.tags.indexOf('storage_proof') !== -1)
				return this.translate('transactionTypes.storageProof');
			else if (this.transaction.tags.indexOf('host_announcement') !== -1)
				return this.translate('transactionTypes.hostAnnouncement');
			else if (this.transaction.tags.indexOf('contract_valid_output') !== -1 || this.transaction.tags.indexOf('contract_missed_output') !== -1)
				return this.translate('transactionTypes.contractCompleted');
			else if (this.transaction.tags.indexOf('block_reward') !== -1)
				return this.translate('transactionTypes.blockReward');
			else if (this.transaction.tags.indexOf('siafund_claim') !== -1)
				return this.translate('transactionTypes.siafundClaim');
			else if (this.transaction.tags.indexOf('defrag') !== -1)
				return this.translate('transactionTypes.defrag');
			else if (this.transaction.tags.indexOf('siacoin_transaction') !== -1) {
				if (this.wallet.currency === 'scp')
					return this.translate('transactionTypes.scprimeTransaction');

				return this.translate('transactionTypes.siacoinTransaction');
			} else if (this.transaction.tags.indexOf('siafund_transaction') !== -1)
				return this.translate('transactionTypes.siafundTransaction');

			return this.transaction.tags[0];
		},
		displayConfirmations() {
			if (this.transaction) {
				if (this.transaction.confirmations === 0)
					return this.translate('unconfirmed');
				else if (this.transaction.confirmations < 6)
					return this.translate('confirmations', this.transaction.confirmations, 6);
			}

			return '';
		},
		transactionClass() {
			const classes = {};

			if (this.transaction && this.transaction.confirmations === 0)
				classes['transaction-unconfirmed'] = true;
			else if (this.transaction && this.transaction.confirmations < 6)
				classes['transaction-partial-confirmed'] = true;

			return classes;
		},
		siacoinClass() {
			const classes = {},
				direction = new BigNumber(this.transaction?.siacoin_outputs).gt(new BigNumber(this.transaction?.siacoin_inputs)) ? 'received' : 'send';

			classes[`value-${direction}`] = true;
			return classes;
		},
		siafundClass() {
			const classes = {},
				direction = this.transaction?.siafund_outputs > this.transaction?.siafund_inputs ? 'received' : 'send';

			classes[`value-${direction}`] = true;
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

.transaction-partial-confirmed {
	opacity: 0.7;

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