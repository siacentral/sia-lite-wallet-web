<template>
	<div class="transaction-outputs">
		<div class="output-title">Inputs</div>
		<template v-for="input in inputs" :key="`sc-input-${input.output_id}`">
			<identicon :value="input.address" />
			<input class="output-address" :value="input.address" readonly />
			<div />
			<div class="text-right" v-html="getOutputSC(input)" />
			<div class="text-right" v-html="getOutputCurrency(input)" />
		</template>
		<template v-for="input in sfInputs" :key="`sf-input-${input.output_id}`">
			<identicon :value="input.address" />
			<input class="output-address" :value="input.address" readonly />
			<div />
			<div class="text-right" v-html="getOutputSF(input)" />
		</template>
		<div class="divider" />
		<div class="output-title">Outputs</div>
		<template v-for="(output, i) in outputs" :key="`sc-output-${i}`">
			<identicon :value="output.address" />
			<input class="output-address" :value="output.address" readonly />
			<div class="text-center">
				<span class="tag">{{ output.tag }}</span>
			</div>
			<div class="text-right" v-html="getOutputSC(output)" />
			<div class="text-right" v-html="getOutputCurrency(output)" />
		</template>
		<template v-for="(output, i) in sfOutputs" :key="`sf-output-${i}`">
			<identicon :value="output.address" />
			<input class="output-address" :value="output.address" readonly />
			<div class="text-center">
				<span class="tag">{{ output.tag }}</span>
			</div>
			<div class="text-right" v-html="getOutputSF(output)" />
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
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
		outputs() {
			console.log('transaction', this.transaction);
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs;
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return [];

			return this.transaction.siacoin_inputs;
		},
		sfInputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siafund_inputs))
				return [];

			return this.transaction.siafund_inputs;
		},
		sfOutputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siafund_outputs))
				return [];

			return this.transaction.siafund_outputs;
		}
	},
	methods: {
		getOutputSF(recipient) {
			const siafunds = formatPriceString(new BigNumber(recipient.value), 2, 'sf', 1, 1);

			return `${siafunds.value} <span class="currency-display">SF</span>`;
		},
		getOutputSC(recipient) {
			const siacoins = formatPriceString(new BigNumber(recipient.value), 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${siacoins.label}`)}</span>`;
		},
		getOutputCurrency(recipient) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(new BigNumber(recipient.value), 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
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
