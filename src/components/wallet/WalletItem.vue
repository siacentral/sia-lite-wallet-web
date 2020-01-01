<template>
	<div :class="{ 'wallet': true, 'active-wallet': active }">
		<div class="wallet-name">{{ wallet.title || 'Wallet' }}</div>
		<div class="wallet-balance" v-html="walletSiacoins"></div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatCurrencyString, formatSiacoinString } from '@/utils/format';

export default {
	props: {
		wallet: Object,
		active: Boolean
	},
	computed: {
		...mapState(['currency', 'currencies']),
		walletBalance() {
			let value = new BigNumber(0);

			if (this.wallet)
				value = this.wallet.unconfirmedBalance();

			return value;
		},
		walletSiacoins() {
			const siacoins = formatSiacoinString(new BigNumber(this.walletBalance));

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		walletCurrency() {
			const currency = formatCurrencyString(new BigNumber(this.walletBalance), this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.wallet {
	position: relative;
    font-size: 1rem;
    text-align: right;
    padding: 15px;
	transition: all 0.3s linear;
	cursor: pointer;
	overflow: hidden;

	.wallet-name {
		font-size: 1.2rem;
		margin-bottom: 3px;
		color: rgba(255, 255, 255, 0.75);
	}

	.wallet-balance {
		color: rgba(255, 255, 255, 0.54);
	}

	&.active-wallet, &:hover, &:focus {
		.wallet-name {
			color: primary;
		}

		.wallet-balance {
			color: rgba(255, 255, 255, 0.75);
		}
	}
}
</style>