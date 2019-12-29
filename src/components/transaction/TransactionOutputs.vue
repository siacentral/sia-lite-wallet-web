<template>
	<div class="transaction-summary">
		<div class="outputs">
			<div class="output-title">Inputs</div>
			<template class="output" v-for="input in inputs" >
				<identicon :value="input.unlock_hash"
					:key="`identicon-${input.output_id}`" />
				<input class="output-address" :key="`address-${input.output_id}`"
					:value="input.unlock_hash" readonly />
				<div :key="`tag-${input.output_id}`" />
				<div class="text-right" v-html="getOutputSC(input)"
					:key="`sc-${input.output_id}`" />
				<div class="text-right" v-html="getOutputCurrency(input)"
					:key="`usd-${input.output_id}`" />
			</template>
			<div class="divider" />
			<div class="output-title">Outputs</div>
			<template class="output" v-for="(output, i) in outputs" >
				<identicon :value="output.unlock_hash"
					:key="`identicon-${i}`" />
				<input class="output-address" :key="`address-${i}`"
					:value="output.unlock_hash" readonly />
				<div :key="`tag-${i}`" class="text-center">
					<span class="tag">{{ output.tag }}</span>
				</div>
				<div class="text-right" v-html="getOutputSC(output)"
					:key="`sc-${i}`" />
				<div class="text-right" v-html="getOutputCurrency(output)"
					:key="`usd-${i}`" />
			</template>
		</div>
		<div class="extras-info">
			<div class="divider" />
			<div>Miner Fee</div>
			<div class="text-right" v-html="minerFeeSC" />
			<div class="text-right" v-html="minerFeeCurrency" />
			<div class="divider" />
			<div>Spent</div>
			<div class="text-right" v-html="totalAmountSC" />
			<div class="text-right" v-html="totalAmountCurrency" />
			<div>Received</div>
			<div class="text-right" v-html="receiveAmountSC" />
			<div class="text-right" v-html="receiveAmountCurrency" />
			<div>Remaining Balance</div>
			<div class="text-right" v-html="remainingBalanceSC" />
			<div class="text-right" v-html="remainingBalanceCurrency" />
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatCurrencyString, formatSiacoinString } from '@/utils/format';

import Identicon from '@/components/Identicon';

export default {
	components: {
		Identicon
	},
	props: {
		transaction: Object,
		wallet: Object
	},
	computed: {
		...mapState(['currency', 'currencies', 'networkFees']),
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
		walletBalance() {
			if (!this.wallet || !this.transaction)
				return new BigNumber(0);

			return this.wallet.unconfirmedBalance().minus(this.sendAmount).minus(this.fees);
		},
		recipients() {
			return this.outputs.filter(o => o.tag === 'Recipient');
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
		sendAmount() {
			return this.inputAmount.minus(this.receiveAmount).minus(this.fees);
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
		},
		minerFeeSC() {
			const siacoins = formatSiacoinString(this.minerFees);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		minerFeeCurrency() {
			const currency = formatCurrencyString(this.minerFees, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		apiFeeSC() {
			const siacoins = formatSiacoinString(this.apiFee);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		apiFeeCurrency() {
			const currency = formatCurrencyString(this.apiFee, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		inputAmountSC() {
			const rem = this.inputAmount,
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		inputAmountCurrency() {
			const rem = this.inputAmount,
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		sendAmountSC() {
			const rem = this.sendAmount,
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		sendAmountCurrency() {
			const rem = this.sendAmount,
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		receiveAmountSC() {
			const rem = this.receiveAmount,
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		receiveAmountCurrency() {
			const rem = this.receiveAmount,
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		totalAmountSC() {
			const rem = this.inputAmount.minus(this.receiveAmount),
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		totalAmountCurrency() {
			const rem = this.inputAmount.minus(this.receiveAmount),
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		remainingBalanceSC() {
			const rem = this.walletBalance.minus(this.inputAmount.minus(this.receiveAmount)),
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		remainingBalanceCurrency() {
			const rem = this.walletBalance.minus(this.inputAmount.minus(this.receiveAmount)),
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	},
	methods: {
		getOutputSC(recipient) {
			const siacoins = formatSiacoinString(new BigNumber(recipient.value));

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		getOutputCurrency(recipient) {
			const currency = formatCurrencyString(new BigNumber(recipient.value), this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.outputs {
	display: grid;
	grid-template-columns: 64px minmax(0, 1fr) repeat(3, auto);
	grid-gap: 15px;
	align-items: safe center;
	margin-bottom: 15px;

	.output-address {
		display: block;
		width: 100%;
		background: none;
		color: rgba(255, 255, 255, 0.54);
		font-size: 1.2rem;
		outline: none;
		border: none;
		text-overflow: ellipsis;
	}

	.output-title {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.54);
		grid-column: 1 / -1;
	}

	.divider {
		width: 100%;
		height: 1px;
		grid-column: 1 / -1;
		background: dark-gray;
		margin: 5px 0;
	}
}

.tag {
	display: inline-block;
    padding: 4px 8px;
    text-align: center;
    background: #383838;
    border-radius: 50px;
    font-size: 0.8rem;
}

.extras-info {
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