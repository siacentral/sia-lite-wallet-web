<template>
	<div class="page page-settings">
		<div class="settings">
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
			<div class="control">
				<label>Automatic Lock Timeout (Minutes)</label>
				<input type="number" v-model.number="newAutoLock" min="1" max="30" @change="setAutoLock(newAutoLock)" />
			</div>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
	computed: {
		...mapState(['currency', 'autoLock'])
	},
	data() {
		return {
			newCurrency: 'usd',
			newAutoLock: 5
		};
	},
	mounted() {
		this.newCurrency = this.currency;
		this.newAutoLock = this.autoLock;
	},
	methods: {
		...mapActions(['setCurrency', 'setAutoLock'])
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
</style>