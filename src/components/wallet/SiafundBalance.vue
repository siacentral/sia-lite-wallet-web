<template>
	<div class="wallet-display-balance" >
		<div>
			{{ formattedSiafunds.value }} <span class="currency-display">{{ translate(`currency.${formattedSiafunds.label}`) }}</span>
		</div>
		<div class="claim-sub">
			(+{{ formattedClaim.value }} <span class="currency-display">{{ translate(`currency.${formattedClaim.label}`) }}</span> dividend)
		</div>
	</div>
</template>

<script>
import { formatPriceString, formatSiafundString } from '@/utils/format';

export default {
	props: {
		siafunds: Object,
		claim: Object,
		wallet: Object
	},
	computed: {
		formattedSiafunds() {
			return formatSiafundString(this.siafunds, this.wallet.currency);
		},
		formattedClaim() {
			return formatPriceString(this.claim, 2, this.wallet.currency, 1, this.wallet.precision());
		}
	}
};
</script>

<style lang="stylus" scoped>
.claim-sub {
	font-size: 0.5em;
}
</style>