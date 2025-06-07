<template>
	<div class="transaction-totals">
		<template v-if="mode === 'outputs'">
			<div>{{ translate('minerFee') }}</div>
			<div class="text-right" v-html="getSiacoin(minerFees)" />
			<div class="text-right" v-html="getCurrency(minerFees)" />
		</template>
		<template v-else>
			<div>{{ translate('transactionFee') }}</div>
			<div class="text-right" v-html="getSiacoin(fees)" />
			<div class="text-right" v-html="getCurrency(fees)" />
		</template>
		<div class="divider" />
		<div>{{ translate('sendSiacoinsModal.spent') }}</div>
		<div class="text-right" v-html="getSiacoin(spentAmount)" />
		<div class="text-right" v-html="getCurrency(spentAmount)" />
		<div>{{ translate('sendSiacoinsModal.remainingBalance') }}</div>
		<div class="text-right" v-html="getSiacoin(walletBalance)" />
		<div class="text-right" v-html="getCurrency(walletBalance)" />
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString } from '@/utils/format';

export default {
	props: {
		transaction: Object,
		wallet: Object,
		mode: String
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
		networkFees() {
			return this.siaNetworkFees;
		},
		walletBalance() {
			if (!this.wallet || !this.transaction)
				return new BigNumber(0);

			return this.wallet.unconfirmedSiacoinBalance().minus(this.inputAmount).plus(this.receiveAmount);
		},
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoinOutputs))
				return [];

			return this.transaction.siacoinOutputs;
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoinInputs))
				return [];

			return this.transaction.siacoinInputs;
		},
		inputAmount() {
			return this.inputs.reduce((total, o) => {
				const value = total.plus(o.value);

				if (value.isNaN() || !value.isFinite())
					return total;

				return value;
			}, new BigNumber(0));
		},
		receiveAmount() {
			return this.outputs.reduce((total, o) => {
				if (!o.owned)
					return total;

				const value = total.plus(o.value);

				if (value.isNaN() || !value.isFinite())
					return total;

				return value;
			}, new BigNumber(0));
		},
		spentAmount() {
			return this.inputAmount.minus(this.receiveAmount);
		},
		minerFees() {
			if (!this.transaction || !Array.isArray(this.transaction.minerFees))
				return new BigNumber(0);

			return this.transaction.minerFees.reduce((total, f) => {
				const value = total.plus(f);

				if (value.isNaN() || !value.isFinite())
					return total;

				return value;
			}, new BigNumber(0));
		},
		fees() {
			return this.minerFees;
		}
	},
	methods: {
		getSiacoin(value) {
			const siacoins = formatPriceString(new BigNumber(value), 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${this.wallet.currency}`)}</span>`;
		},
		getCurrency(value) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(new BigNumber(value), 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-totals {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	grid-gap: 10px;
	margin-bottom: 15px;

	.divider {
		width: 100%;
		height: 1px;
		grid-column: 1 / -1;
		background: dark-gray;
		margin: 5px 0;
	}
}
</style>