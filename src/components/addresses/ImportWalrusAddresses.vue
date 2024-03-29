<template>
	<div class="add-addresses">
		<connect-ledger :connected="connected" @connected="onConnected" v-if="walletType === 'ledger'" />
		<div class="app-status">
			<template v-if="walletType === 'ledger'">
				<div>{{ translate('status') }}</div>
				<div />
				<div />
				<div class="text-right">{{ connected ? translate('ledger.connected') : translate('ledger.disconnected') }} <template v-if="ledgerVersion">{{ ledgerVersion }}</template></div>
			</template>
			<div>{{ translate('importAddresses.importedHeader') }}</div>
			<div />
			<div />
			<div class="text-right">{{ formatNumber(this.addresses.length) }}</div>
			<div>{{ translate('importAddresses.balance') }}</div>
			<div />
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
		</div>
		<div class="buttons text-right">
			<button class="btn btn-inline btn-success" @click="onAddAddress" :disabled="!ready">{{ translate('importAddresses.addAddress') }}</button>
		</div>
		<import-address-list v-model="addresses" :wallet="wallet" :ledgerDevice="ledgerDevice" />
		<div class="buttons">
			<button class="btn btn-inline btn-success" @click="onAddAddresses" :disabled="!valid || !ready">{{ translate('done') }}</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { verifyAddress } from '@/utils';
import { generateAddresses as generateSiaAddresses, encodeUnlockHash } from '@/sia';
import { formatPriceString, formatNumber } from '@/utils/format';
import WalrusClient from '@/api/walrus';

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
			apiClient: null,
			ledgerDevice: null,
			ledgerVersion: '',
			addresses: [],
			siacoinBalance: new BigNumber(0),
			displayPublicKey: false,
			ready: false,
			connected: false,
			refreshTimeout: null
		};
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
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
			let balance = new BigNumber(this.siacoinBalance),
				exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatPriceString(balance, 2, this.currency, exchangeRate[this.currency]);

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		valid() {
			if (!Array.isArray(this.addresses) || this.addresses.length === 0)
				return false;

			return this.addresses.filter(a => {
				return !verifyAddress(a.address);
			}).length === 0;
		}
	},
	async mounted() {
		try {
			this.apiClient = new WalrusClient(this.wallet.server_url);
			this.addresses = await this.apiClient.getUnlockConditions();

			await this.refreshWalletBalance();

			if (this.walletType !== 'ledger')
				this.ready = true;
			else
				this.displayPublicKey = true;
		} catch (ex) {
			console.error('ImportSiaAddressesMounted', ex);
			this.pushNotification({
				message: ex.message,
				severity: 'danger'
			});
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
					signaturesrequired: 1,
					publickeys: [publicKey]
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
				addr = (await generateSiaAddresses(this.wallet.seed, this.wallet.currency, nextIndex, 1))[0];
				break;
			}

			return addr;
		},
		async refreshWalletBalance() {
			const balance = await this.apiClient.getBalance(true);

			this.siacoinBalance = new BigNumber(balance);
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
		async onDeleteAddress(i) {
			if (!this.ready)
				return;

			this.ready = false;

			try {
				await this.apiClient.removeAddress(this.addresses[i]);
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

				await this.apiClient.addUnlockConditions({
					publicKeys: address.unlock_conditions.publickeys,
					signaturesRequired: address.unlock_conditions.signaturesrequired
				}, address.index);
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
		async addWalrusAddress(i) {

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
	grid-template-columns: minmax(0, 1fr) repeat(3, auto);
	grid-gap: 15px;
	padding: 15px 0;
	border-top: 1px solid dark-gray;
	border-bottom: 1px solid dark-gray;
}
</style>