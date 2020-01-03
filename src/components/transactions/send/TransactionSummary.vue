<template>
	<div class="transaction-summary">
		<template class="recipient" v-for="(recipient, i) in recipients" >
			<identicon :value="recipient.unlock_hash"
				:key="`identicon-${i}`" />
			<input class="recipient-address" :key="`address-${i}`"
				:value="recipient.unlock_hash" readonly />
			<div class="text-right" v-html="getRecipientSC(recipient)"
				:key="`sc-${i}`" />
			<div class="text-right" v-html="getRecipientCurrency(recipient)"
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
		...mapState(['currency', 'currencies', 'networkFees']),
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs;
		},
		recipients() {
			return this.outputs.filter(o => o.tag === 'Recipient');
		}
	},
	methods: {
		getRecipientSC(recipient) {
			const siacoins = formatPriceString(new BigNumber(recipient.value), 2);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		getRecipientCurrency(recipient) {
			const currency = formatPriceString(new BigNumber(recipient.value), 2, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-summary {
	display: grid;
	grid-template-columns: 64px minmax(0, 1fr) repeat(2, auto);
	grid-gap: 15px;
	align-items: safe center;
	margin-bottom: 15px;

	.recipient-address {
		display: block;
		width: 100%;
		background: none;
		color: rgba(255, 255, 255, 0.54);
		font-size: 1.2rem;
		outline: none;
		border: none;
		text-overflow: ellipsis;
	}
}
</style>