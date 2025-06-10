<template>
	<div class="add-addresses">
		<connect-ledger :connected="connected" @connected="onConnected" v-if="walletType === 'ledger'" />
		<div class="app-status">
			<template v-if="walletType === 'ledger'">
				<div>{{ translate('status') }}</div>
				<div class="text-right address-count">{{ connected ? translate('ledger.connected') : translate('ledger.disconnected') }} <template v-if="ledgerVersion">{{ ledgerVersion }}</template></div>
			</template>
			<div>{{ translate('importAddresses.importedHeader') }}</div>
			<div class="text-right address-count">{{ formatNumber(this.addresses.length) }}</div>
			<div>{{ translate('importAddresses.balance') }}</div>
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
			<!--<div class="text-right" v-if="siafundBalance.gt(0)" v-html="balanceSF" />-->
		</div>
		<div class="buttons text-right">
			<button class="btn btn-inline btn-success" @click="onAddAddress" :disabled="!ready">{{ translate('importAddresses.addAddress') }}</button>
		</div>
		<import-address-list v-model="addresses" :wallet="wallet" :ledgerDevice="ledgerDevice" :readonly="walletType === 'ledger'" />
		<div class="buttons">
			<button class="btn btn-inline btn-success" @click="onAddAddresses" :disabled="!valid || !ready">{{ translate('done') }}</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { verifyAddress } from '@/utils';
import { getExchangeRate } from '@/api/siacentral';
import { getTransactions, generateAddresses as generateSiaAddresses, encodeUnlockHash } from '@/sia';
import { formatPriceString, formatSiafundString, formatNumber } from '@/utils/format';
import { getWalletAddresses } from '@/store/db';

import ConnectLedger from '@/components/ledger/ConnectLedger';
import ImportAddressList from './ImportAddressList';

export default {
	components: {
		ConnectLedger,
		ImportAddressList
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			ledgerDevice: null,
			ledgerVersion: '',
			addresses: [],
			siacoinBalance: new BigNumber(0),
			siafundBalance: new BigNumber(0),
			ready: false,
			connected: false,
			exchangeRate: 0,
			refreshTimeout: null
		};
	},
	computed: {
		...mapState(['currency']),
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		},
		balanceSC() {
			let balance = new BigNumber(this.siacoinBalance);

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatPriceString(balance, 2);

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		balanceCurrency() {
			const precision = new BigNumber('1e24');
			let balance = new BigNumber(this.siacoinBalance);

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatPriceString(balance, 2, this.currency, this.exchangeRate, precision);

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		balanceSF() {
			let balance = new BigNumber(this.siafundBalance);

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatSiafundString(balance, this.wallet.currency);

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		valid() {
			if (!Array.isArray(this.addresses) || this.addresses.length === 0)
				return false;

			if (this.walletType === 'ledger')
				return true;

			return this.addresses.filter(a => !verifyAddress(a.address)).length === 0;
		}
	},
	async beforeMount() {
		const exchangeRate = await getExchangeRate(this.currency);
		this.exchangeRate = exchangeRate;
	},
	async mounted() {
		try {
			if (this.wallet.id) {
				const existing = await getWalletAddresses(this.wallet.id);

				existing.reverse();

				this.addresses = existing.map(a => {
					const addr = {
						...a
					};

					if (a.unlock_conditions && Array.isArray(a.unlock_conditions.publickeys) && a.unlock_conditions.publickeys.length !== 0)
						addr.pubkey = a.unlock_conditions.publickeys[0].substr(8);

					return addr;
				});
			}

			await this.refreshWalletBalance();

			if (this.walletType !== 'ledger')
				this.ready = true;
			else
				this.displayPublicKey = true;
		} catch (ex) {
			console.error('ImportSiaAddressesMounted', ex);
		}
	},
	beforeDestroy() {
		// Close the ledger device when we're done
		if (this.ledgerDevice)
			this.ledgerDevice.close();
	},
	methods: {
		formatNumber,
		async generateLedgerAddr(nextIndex) {
			if (!this.ledgerDevice || !this.connected)
				throw new Error('Ledger not connected');

			const { publicKey, address } = await this.ledgerDevice.verifyStandardAddress(nextIndex);

			return {
				address: address,
				pubkey: publicKey.substr(8),
				unlock_conditions: {
					timelock: 0,
					requiredSignatures: 1,
					publicKeys: [publicKey]
				},
				index: nextIndex
			};
		},
		async generateAddress() {
			const nextIndex = this.addresses.reduce((v, a) => a.index > v ? a.index : v, -1) + 1;
			let addr;

			switch (this.walletType) {
			case 'watch':
				addr = {
					address: '',
					index: nextIndex
				};
				break;
			case 'ledger':
				this.displayPublicKey = true;
				addr = await this.generateLedgerAddr(nextIndex);
				break;
			default:
				addr = await generateSiaAddresses(this.wallet.seed, this.wallet.currency, nextIndex, 1);
			}

			return addr;
		},
		async refreshWalletBalance() {
			const balance = await getTransactions(this.addresses.reduce((addrs, a) => {
				if (verifyAddress(a.address))
					addrs.push(a.address);

				return addrs;
			}, []), this.wallet.currency, this.currency);

			let deltaSC = new BigNumber(balance.unconfirmed_siacoin_delta),
				deltaSF = new BigNumber(balance.unconfirmed_siafund_delta);

			if (deltaSC.isNaN())
				deltaSC = new BigNumber(0);

			if (deltaSF.isNaN())
				deltaSF = new BigNumber(0);

			this.siacoinBalance = new BigNumber(balance.confirmed_siacoin_balance).plus(deltaSC);
			this.siafundBalance = new BigNumber(balance.confirmed_siafund_balance).plus(deltaSF);
		},
		async onConnected(device) {
			try {
				this.ledgerVersion = await device.getVersion();
				this.ledgerDevice = device;
				this.ready = true;
				this.connected = true;
			} catch (ex) {
				device.close();
				console.error('onConnected', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onDeleteAddress(i) {
			if (!this.ready)
				return;

			this.ready = false;

			try {
				this.addresses.splice(i, 1);
			} catch (ex) {
				console.error('onDeleteAddress', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'trash',
					message: ex.message
				});
			} finally {
				this.ready = true;
			}
		},
		async onAddAddress() {
			if (!this.ready)
				return;

			this.ready = false;

			try {
				const address = await this.generateAddress();

				this.addresses.unshift(address);
				await this.refreshWalletBalance();
			} catch (ex) {
				console.error('onAddPublicKey', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.ready = true;
			}
		},
		async encodeLedgerImport(i) {
			const address = await encodeUnlockHash(this.addresses[i].unlock_conditions);

			this.addresses[i].address = address;
		},
		async onAddAddresses() {
			if (!this.ready)
				return;

			this.ready = false;

			try {
				this.$emit('imported', this.addresses.map(a => ({
					address: a.address,
					index: a.index,
					unlock_conditions: a.unlock_conditions
				})));
			} catch (ex) {
				console.error('onAddAddresses', ex.message);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.ready = true;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.add-addresses {
	display: grid;
	height: 100%;
	grid-template-rows: repeat(3, auto) minmax(0, 1fr) auto;
	grid-gap: 15px;
}

.app-status {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	grid-gap: 15px;
	padding: 15px 0;
	border-top: 1px solid dark-gray;
	border-bottom: 1px solid dark-gray;
}

.address-count {
	grid-column: span 2;
}
</style>