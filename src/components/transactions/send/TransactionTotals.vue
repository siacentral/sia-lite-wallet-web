<template>
	<div class="transaction-totals">
		<template v-if="mode === 'outputs'">
			<div>Miner Fee</div>
			<div class="text-right" v-html="getSiacoin(minerFees)" />
			<div class="text-right" v-html="getCurrency(minerFees)" />
		</template>
		<template v-else>
			<div>Fees</div>
			<div class="text-right" v-html="getSiacoin(fees)" />
			<div class="text-right" v-html="getCurrency(fees)" />
		</template>
		<div class="divider" />
		<div>Spent</div>
		<div class="text-right" v-html="getSiacoin(spentAmount)" />
		<div class="text-right" v-html="getCurrency(spentAmount)" />
		<div>Remaining Balance</div>
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
		...mapState(['currency', 'currencies', 'networkFees']),
		walletBalance() {
			if (!this.wallet || !this.transaction)
				return new BigNumber(0);

			return this.wallet.unconfirmedSiacoinBalance().minus(this.inputAmount).plus(this.receiveAmount).minus(this.fees);
		},
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs;
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return [];

			return this.transaction.siacoin_inputs;
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
			if (!this.transaction || !Array.isArray(this.transaction.miner_fees))
				return new BigNumber(0);

			return this.transaction.miner_fees.reduce((total, f) => {
				const value = total.plus(f);

				if (value.isNaN() || !value.isFinite())
					return total;

				return value;
			}, new BigNumber(0));
		},
		apiFee() {
			return this.outputs.reduce((total, o) => {
				if (o.tag !== 'API Fee')
					return total;

				const value = total.plus(o.value);

				if (value.isNaN() || !value.isFinite())
					return total;

				return value;
			}, new BigNumber(0));
		},
		fees() {
			return this.apiFee.plus(this.minerFees);
		}
	},
	methods: {
		getSiacoin(value) {
			const siacoins = formatPriceString(new BigNumber(value), 2);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		getCurrency(value) {
			const currency = formatPriceString(new BigNumber(value), 2, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
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