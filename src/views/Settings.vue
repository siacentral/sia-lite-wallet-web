<template>
	<div class="page page-settings">
		<mobile-nav />
		<div class="settings">
			<h2>{{ translate('settings.displayHeader') }}</h2>
			<div class="control-group">
				<div class="control">
					<p class="text-warning" v-if="useCostBasis">{{ translate('settings.pCurrencyCostBasis') }}</p>
					<label>{{ translate('settings.lblDisplayCurrency') }}</label>
					<select v-model="newCurrency" @change="setCurrency(newCurrency)">
						<optgroup :label="translate('currency.fiat')">
							<option value="usd">{{ translate('currency.usd') }}</option>
							<option value="jpy">{{ translate('currency.jpy') }}</option>
							<option value="eur">{{ translate('currency.eur') }}</option>
							<option value="gbp">{{ translate('currency.gbp') }}</option>
							<option value="aus">{{ translate('currency.aus') }}</option>
							<option value="cad">{{ translate('currency.cad') }}</option>
							<option value="rub">{{ translate('currency.rub') }}</option>
							<option value="cny">{{ translate('currency.cny') }}</option>
						</optgroup>
						<optgroup :label="translate('currency.crypto')">
							<option value="btc">{{ translate('currency.btc') }}</option>
							<option value="bch">{{ translate('currency.bch') }}</option>
							<option value="eth">{{ translate('currency.eth') }}</option>
							<option value="xrp">{{ translate('currency.xrp') }}</option>
							<option value="ltc">{{ translate('currency.ltc') }}</option>
						</optgroup>
					</select>
				</div>
			</div>
			<div class="control">
				<input type="checkbox" id="chk-use-cost-basis" v-model="newUseCostBasis" @change="setUseCostBasis(newUseCostBasis)" />
				<label for="chk-use-cost-basis">{{ translate('settings.lblUseCostBasis') }}</label>
			</div>
			<div class="control">
				<label>{{ translate('settings.lblDisplayLanguage') }}</label>
				<select v-model="newLanguage" @change="setDisplayLanguage(newLanguage)">
					<option value="detect">{{ translate('language.automatic') }}</option>
					<option v-for="language in languages" :key="language" :value="language">{{ translate(`language.${language}`) }}</option>
				</select>
			</div>
			<h2>{{ translate('settings.securityHeader') }}</h2>
			<div class="control">
				<label>{{ translate('settings.lblAutomaticLock') }}</label>
				<input type="number" v-model.number="newAutoLock" min="1" max="30" @change="setAutoLock(newAutoLock)" />
			</div>
			<div class="control-grouping">
				<p class="text-warning">{{ translate('settings.pExplainLookahead') }}</p>
				<div class="control">
					<label>{{ translate('settings.lblAddressLookaHead') }}</label>
					<input type="number" min="100" max="5000000" v-model.number="newMinLookahead" @change="setAddressLookahead(newMinLookahead)" />
				</div>
			</div>
			<div class="divider" />
			<div class="control">
				<input type="checkbox" id="chk-show-advanced" v-model="showAdvanced" />
				<label for="chk-show-advanced">{{ translate('settings.chkShowAdvanced') }}</label>
			</div>
			<template v-if="showAdvanced">
				<h2>Advanced</h2>
				<div class="control-grouping">
					<p class="text-warning">{{ translate('settings.pChangeServerType') }}</p>
					<div class="control">
						<input type="checkbox" id="chk-change-server-type" v-model="newChangeServerType" @change="setChangeServerType(newChangeServerType)" />
						<label for="chk-change-server-type">{{ translate('settings.chkChangeWalletServer') }}</label>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { languages } from '@/translation';
import { formatNumber } from '@/utils/format';

import MobileNav from '@/components/MobileNav';

export default {
	components: {
		MobileNav
	},
	computed: {
		...mapState(['currency', 'autoLock', 'changeSeedType', 'changeServerType',
			'addressLookahead', 'displayLanguage', 'useCostBasis']),
		languages() {
			return languages;
		}
	},
	data() {
		return {
			showAdvanced: false,
			newCurrency: 'usd',
			newAutoLock: 5,
			newChangeSeedType: false,
			newChangeServerType: false,
			newMinLookahead: 1000,
			newLanguage: 'detect',
			newUseCostBasis: false
		};
	},
	mounted() {
		this.newCurrency = this.currency;
		this.newUseCostBasis = this.useCostBasis;
		this.newAutoLock = this.autoLock;
		this.newChangeSeedType = this.changeSeedType;
		this.newChangeServerType = this.changeServerType;
		this.newMinLookahead = this.addressLookahead;
		this.newLanguage = this.displayLanguage;
	},
	methods: {
		...mapActions(['setCurrency', 'setAutoLock', 'setChangeSeedType', 'setChangeServerType',
			'setAddressLookahead', 'setDisplayLanguage', 'setUseCostBasis']),
		formatNumber
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
	padding: 15px 15px 0;
	background: bg-dark-accent;
	border-radius: 4px;
	margin-bottom: 15px;

	.control {
		margin-bottom: 15px;
	}

	p {
		margin-top: 0;
	}
}
</style>