<template>
	<tbody>
		<tr v-for="(output, i) in outputs" :key="i">
			<td class="fit-text icon">
				<identicon :value="output.address" />
			</td>
			<td>
				<input class="output-address" :value="output.address" readonly />
			</td>
			<td  class="fit-text text-center">
				<span class="tag">{{ output.tag }}</span>
			</td>
			<td class="fit-text text-right" v-html="getOutputSC(output)" />
			<td class="fit-text text-right" v-html="getOutputCurrency(output)" />
		</tr>
	</tbody>
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
		title: String,
		outputs: Array,
		wallet: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP'])
	},
	methods: {
		getOutputSC(output) {
			const siacoins = formatPriceString(new BigNumber(output.value), 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${siacoins.label}`)}</span>`;
		},
		getOutputCurrency(output) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(new BigNumber(output.value), 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.output-title {
	font-size: 1.2rem;
	color: rgba(255, 255, 255, 0.54);
	grid-column: 1 / -1;
}

tbody tr td {
	padding: 8px;
}

.tag {
	display: inline-block;
    padding: 4px 8px;
    text-align: center;
    background: #383838;
    border-radius: 50px;
    font-size: 0.8rem;
}

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

.icon {
	font-size: 0;

	.identicon {
		width: 48px;
		height: auto;
	}
}
</style>