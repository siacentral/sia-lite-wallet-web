<template>
	<div class="page page-settings">
		<mobile-nav />
		<div class="settings">
			<h2>Display</h2>
			<div class="control">
				<label>Display Currency</label>
				<select v-model="newCurrency" @change="setCurrency(newCurrency)">
					<optgroup label="Fiat">
						<option value="usd">USD</option>
						<option value="jpy">JPY</option>
						<option value="eur">EUR</option>
						<option value="gbp">GBP</option>
						<option value="aus">AUS</option>
						<option value="cad">CAD</option>
						<option value="rub">RUB</option>
						<option value="cny">CNY</option>
					</optgroup>
					<optgroup label="Crypto">
						<option value="btc">BTC</option>
						<option value="bch">BCH</option>
						<option value="eth">ETH</option>
						<option value="xrp">XRP</option>
						<option value="ltc">LTC</option>
					</optgroup>
				</select>
			</div>
			<h2>Security</h2>
			<div class="control">
				<label>Automatic Lock Timeout (Minutes)</label>
				<input type="number" v-model.number="newAutoLock" min="1" max="30" @change="setAutoLock(newAutoLock)" />
			</div>
			<div class="divider" />
			<div class="control">
				<input type="checkbox" id="chk-show-advanced" v-model="showAdvanced" />
				<label for="chk-show-advanced">Show Advanced</label>
			</div>
			<template v-if="showAdvanced">
				<h2>Advanced</h2>
				<div class="control-grouping">
					<p class="text-warning">12 word seeds are not compatible with the official Sia
						wallets. They are commonly used with Walrus wallets. Enabling this setting
						will show a dropdown when creating a new wallet allowing you to generate
						either a new Sia seed or a 12 word seed.</p>
					<div class="control">
						<input type="checkbox" id="chk-change-seed-type" v-model="newChangeSeedType" @change="setChangeSeedType(newChangeSeedType)" />
						<label for="chk-change-seed-type">Generate 12 Word Seeds</label>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import MobileNav from '@/components/MobileNav';

export default {
	components: {
		MobileNav
	},
	computed: {
		...mapState(['currency', 'autoLock', 'changeSeedType'])
	},
	data() {
		return {
			showAdvanced: false,
			newCurrency: 'usd',
			newAutoLock: 5,
			newChangeSeedType: false
		};
	},
	mounted() {
		this.newCurrency = this.currency;
		this.newAutoLock = this.autoLock;
		this.newChangeSeedType = this.changeSeedType;
	},
	methods: {
		...mapActions(['setCurrency', 'setAutoLock', 'setChangeSeedType'])
	}
};
</script>

<style lang="stylus" scoped>
.settings {
	display: grid;
	width: 100%;
	height: 100%;
	max-width: 700px;
	margin: auto;
	padding: 15px;
	align-content: safe center;
	overflow-x: hidden;
	overflow-y: auto;
}

.control-grouping {
	padding: 15px;
	background: bg-dark-accent;
	border-radius: 4px;

	.control {
		margin-bottom: 0;
	}

	p {
		margin-top: 0;
	}
}
</style>