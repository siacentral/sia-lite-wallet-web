<template>
	<div class="transaction-outputs">
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
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString } from '@/utils/format';

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
		...mapState(['currency', 'exchangeRateSC', 'networkFees']),
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs;
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return [];

			return this.transaction.siacoin_inputs;
		}
	},
	methods: {
		getOutputSC(recipient) {
			const siacoins = formatPriceString(new BigNumber(recipient.value), 2);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		getOutputCurrency(recipient) {
			const currency = formatPriceString(new BigNumber(recipient.value), 2, this.currency, this.exchangeRateSC[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-outputs {
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
</style>