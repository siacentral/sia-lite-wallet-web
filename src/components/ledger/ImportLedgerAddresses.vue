<template>
	<div class="import-ledger">
		<connect-ledger :connected="connected" @connected="onConnected" />
		<div class="app-status">
			<div>Status</div>
			<div />
			<div class="text-right">{{ connected ? 'Connected' : 'Not Connected' }} <template v-if="version">{{ version }}</template></div>
			<div>Imported Addresses</div>
			<div />
			<div class="text-right">{{ formatNumber(nextIndex) }}</div>
			<div>Current Balance</div>
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
		</div>
		<div class="address-controls text-right">
			<button class="btn btn-inline btn-success" @click="onAddPublicKey" :disabled="adding || !connected || !loaded">Import Address</button>
		</div>
		<div class="address-list">
			<table>
				<tbody>
					<tr v-for="address in addresses" :key="address.address">
						<td class="text-right fit-text">{{ formatNumber(address.index) }}</td>
						<td><input :value="address.unlock_conditions.publickeys[0].substr(8)" readonly /></td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="text-center address-controls">
			<button class="btn btn-inline btn-success" @click="onAddAddresses" :disabled="adding || !connected || !loaded || !added">Add Addresses</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { ledgerSupported, getVersion, getPublicKey } from '@/utils/ledger';
import { encodeUnlockHash, getTransactions } from '@/utils/sia';
import { formatPriceString, formatNumber } from '@/utils/format';
import { getWalletAddresses, saveAddresses } from '@/store/db';

import ConnectLedger from '@/components/ledger/ConnectLedger';

export default {
	components: {
		ConnectLedger
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			loaded: false,
			connected: false,
			adding: false,
			added: false,
			version: '',
			balance: new BigNumber(0),
			error: null,
			nextIndex: 0,
			addresses: []
		};
	},
	computed: {
		...mapState(['currency', 'currencies']),
		ledgerSupported() {
			return ledgerSupported();
		},
		balanceSC() {
			const format = formatPriceString(this.balance, 2);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		balanceCurrency() {
			const format = formatPriceString(this.balance, 2, this.currency, this.currencies[this.currency]);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		}
	},
	async mounted() {
		try {
			if (!this.wallet) {
				this.loaded = true;
				return;
			}

			const existing = await getWalletAddresses(this.wallet.id);

			this.addresses = existing;
			this.addresses.reverse();

			if (this.addresses.length !== 0) {
				await this.refreshWalletBalance();

				this.nextIndex = this.addresses[0].index + 1;
			}

			this.loaded = true;
		} catch (ex) {
			console.error(ex);
			this.pushNotification({
				severity: 'danger',
				icon: ['fab', 'usb'],
				message: ex.message
			});
		}
	},
	methods: {
		formatNumber,
		async onConnected(err) {
			try {
				if (err) {
					this.connected = false;
					this.error = err;
					return;
				}

				this.version = await getVersion();
				this.connected = true;
			} catch (ex) {
				console.error('onConnected', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
				this.connected = false;
			}
		},
		async refreshWalletBalance() {
			const balance = await getTransactions(this.addresses.map(a => a.address));

			this.balance = new BigNumber(balance.confirmed_balance).minus(balance.unconfirmed_delta);
		},
		async onAddAddresses() {
			try {
				if (!this.wallet || !this.wallet.id)
					throw new Error('unknown wallet');

				await saveAddresses(this.addresses.map(a => ({
					...a,
					wallet_id: this.wallet.id
				})));

				this.queueWallet(this.wallet.id);
				this.$emit('imported', this.addresses);
			} catch (ex) {
				console.error('onAddAddresses', ex.message);
				this.pushNotification({
					severity: 'danger',
					icon: 'redo',
					message: ex.message
				});
			}
		},
		async onAddPublicKey() {
			if (this.adding)
				return;

			this.adding = true;

			try {
				const i = this.nextIndex,
					key = await getPublicKey(i),
					unlockConditions = {
						timelock: 0,
						publickeys: [key],
						signaturesrequired: 1
					},
					addr = await encodeUnlockHash(unlockConditions);

				this.addresses.unshift({
					address: addr,
					unlock_conditions: unlockConditions,
					index: i
				});
				this.added = true;
				this.nextIndex++;

				await this.refreshWalletBalance();
			} catch (ex) {
				console.error('onAddPublicKey', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
			} finally {
				this.adding = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.import-ledger {
	display: grid;
	height: 100%;
	grid-template-rows: repeat(3, auto) minmax(0, 1fr) auto;
	grid-gap: 15px;
}

.address-controls {
	button {
		margin: 0;
	}
}

.address-list {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;

	table tbody tr {
		border-top: 1px solid dark-gray;
		border-bottom: 1px solid dark-gray;
		background: transparent;

		td {
			padding: 20px 8px;
		}
	}

	input {
		display: block;
		width: 100%;
		border: none;
		outline: none;
		background: transparent;
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.54);
		text-overflow: ellipsis;
	}
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