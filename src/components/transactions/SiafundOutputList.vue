<template>
	<tbody>
		<tr v-for="(output, i) in outputs" :key="i">
			<td class="fit-text icon">
				<identicon :value="output.unlock_hash" />
			</td>
			<td>
				<input class="output-address" :value="output.unlock_hash" readonly />
			</td>
			<td  class="fit-text text-center">
				<span class="tag">{{ output.tag }}</span>
			</td>
			<td class="fit-text text-right" v-html="getOutputSF(output)" />
			<td class="fit-text text-right" v-html="getOutputCurrency(output)" />
		</tr>
	</tbody>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString, formatSiafundString } from '@/utils/format';

import Identicon from '@/components/Identicon';

export default {
	components: {
		Identicon
	},
	props: {
		title: String,
		outputs: Array
	},
	computed: {
		...mapState(['currency', 'exchangeRateSF'])
	},
	methods: {
		getOutputSF(output) {
			const siafunds = formatSiafundString(new BigNumber(output.value), 2);

			return `${siafunds.value} <span class="currency-display">${this.translate(`currency.${siafunds.label}`)}</span>`;
		},
		getOutputCurrency(output) {
			const currency = formatPriceString(new BigNumber(output.value).times(1e24), 2, this.currency, this.exchangeRateSF[this.currency]);

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