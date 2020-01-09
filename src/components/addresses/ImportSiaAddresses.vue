<template>
	<div class="add-addresses">
		<connect-ledger :connected="connected" @connected="onConnected" v-if="walletType === 'ledger'" />
		<div class="app-status">
			<template v-if="walletType === 'ledger'">
				<div>Status</div>
				<div />
				<div class="text-right">{{ connected ? 'Connected' : 'Not Connected' }} <template v-if="ledgerVersion">{{ ledgerVersion }}</template></div>
			</template>
			<div>Imported Addresses</div>
			<div />
			<div class="text-right">{{ formatNumber(this.addresses.length) }}</div>
			<div>Current Balance</div>
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
		</div>
		<div class="buttons text-right">
			<button class="btn btn-inline btn-success" @click="onAddAddress" :disabled="!ready">{{ addText }}</button>
		</div>
		<import-address-list v-model="addresses" :wallet="wallet" />
		<div class="buttons">
			<button class="btn btn-inline btn-success" @click="onAddAddresses" :disabled="!valid || !ready">Add</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { verifyAddress } from '@/utils';
import { getTransactions, generateAddresses as generateSiaAddresses, encodeUnlockHash } from '@/utils/sia';
import { formatPriceString, formatNumber } from '@/utils/format';
import { getPublicKey as generateLedgerPubKey } from '@/utils/ledger';
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
			ledgerVersion: '',
			addresses: [],
			balance: new BigNumber(0),
			ready: false,
			connected: false,
			refreshTimeout: null
		};
	},
	computed: {
		...mapState(['currency', 'currencies']),
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		},
		addText() {
			return this.walletType === 'ledger' ? 'Import Public Key' : 'Add Address';
		},
		balanceSC() {
			let balance = new BigNumber(this.balance);

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatPriceString(balance, 2);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		balanceCurrency() {
			let balance = new BigNumber(this.balance);

			if (balance.isNaN() || !balance.isFinite())
				balance = new BigNumber(0);

			const format = formatPriceString(balance, 2, this.currency, this.currencies[this.currency]);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		valid() {
			if (this.walletType === 'ledger')
				return true;

			return !Array.isArray(this.addresses) || this.addresses.length === 0 || this.addresses.filter(a => !verifyAddress(a.address)).length === 0;
		}
	},
	async mounted() {
		try {
			if (this.wallet.id) {
				const existing = await getWalletAddresses(this.wallet.id);

				existing.reverse();

				this.addresses = existing;
			}

			if (this.walletType !== 'ledger')
				this.ready = true;
		} catch (ex) {
			console.error('ImportSiaAddressesMounted', ex);
		}
	},
	methods: {
		formatNumber,
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
				const key = await generateLedgerPubKey(nextIndex),
					unlockConditions = {
						timelock: 0,
						signaturesrequired: 1,
						publickeys: [key]
					},
					address = await encodeUnlockHash(unlockConditions);

				addr = {
					address: address,
					pubkey: key.substr(8),
					unlock_conditions: unlockConditions,
					index: nextIndex
				};
				break;
			default:
				addr = await generateSiaAddresses(this.wallet.seed, nextIndex, 1);
			}

			return addr;
		},
		async refreshWalletBalance() {
			const balance = await getTransactions(this.addresses.reduce((addrs, a) => {
				if (verifyAddress(a.address))
					addrs.push(a.address);

				return addrs;
			}, []));
			let delta = new BigNumber(balance.unconfirmed_delta);

			if (delta.isNaN())
				delta = new BigNumber(0);

			this.balance = new BigNumber(balance.confirmed_balance).minus(delta);
		},
		onConnected() {
			this.ready = true;
			this.connected = true;
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
</style>