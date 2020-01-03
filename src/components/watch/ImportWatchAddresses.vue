<template>
	<div class="add-addresses">
		<div class="app-status">
			<div>Imported Addresses</div>
			<div />
			<div class="text-right">{{ formatNumber(this.addresses.length) }}</div>
			<div>Current Balance</div>
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
		</div>
		<div class="address-controls text-right">
			<button class="btn btn-inline btn-success" @click="onAddAddress" :disabled="adding || !loaded">Add Address</button>
		</div>
		<div class="address-list">
			<table>
				<tbody>
					<tr v-for="(address, i) in addresses" :key="i">
						<td class="text-right fit-text">{{ formatNumber(addresses.length - i) }}</td>
						<td><input v-model="addresses[i]" placeholder="Sia address to watch..." /></td>
						<td class="fit-text" v-if="addresses.length > 1">
							<button class="delete-btn" @click="onDeleteAddress(i)">
								<icon icon="times" />
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="text-center address-controls">
			<button class="btn btn-inline btn-success" @click="onAddAddresses" :disabled="!valid || adding || !loaded || !added">Add Addresses</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { verifyAddress } from '@/utils';
import { getTransactions } from '@/utils/sia';
import { formatPriceString, formatNumber } from '@/utils/format';
import { getWalletAddresses, saveAddresses } from '@/store/db';

export default {
	props: {
		wallet: Object
	},
	data() {
		return {
			loaded: false,
			adding: false,
			added: false,
			balance: new BigNumber(0),
			addresses: [],
			refreshTimeout: null
		};
	},
	computed: {
		...mapState(['currency', 'currencies']),
		balanceSC() {
			const format = formatPriceString(this.balance, 2);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		balanceCurrency() {
			const format = formatPriceString(this.balance, 2, this.currency, this.currencies[this.currency]);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		valid() {
			return !Array.isArray(this.addresses) || this.addresses.length === 0 || this.addresses.filter(a => !verifyAddress(a)).length === 0;
		}
	},
	async mounted() {
		try {
			if (!this.wallet) {
				this.loaded = true;
				return;
			}

			const existing = await getWalletAddresses(this.wallet.id);

			this.addresses = existing.map(a => a.address);
			this.addresses.reverse();

			if (this.addresses.length !== 0) {
				await this.refreshWalletBalance();

				this.nextIndex = this.addresses[0].index + 1;
			}

			this.loaded = true;
		} catch (ex) {
			console.error('ImportWatchAddresesMounted', ex);
			this.pushNotification({
				severity: 'danger',
				message: ex.message
			});
		}
	},
	methods: {
		formatNumber,
		onDeleteAddress(i) {
			try {
				this.addresses.splice(i, 1);
			} catch (ex) {
				console.error('onDeleteAddress', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'trash',
					message: ex.message
				});
			}
		},
		async refreshWalletBalance() {
			const balance = await getTransactions(this.addresses
				.filter(a => verifyAddress(a)));
			let delta = new BigNumber(balance.unconfirmed_delta);

			if (delta.isNaN())
				delta = new BigNumber(0);

			this.balance = new BigNumber(balance.confirmed_balance).minus(delta);
		},
		async onRefreshWalletBalance() {
			try {
				if (!this.addresses.length === 0)
					return;

				await this.refreshWalletBalance();
			} catch (ex) {
				console.error('onRefreshWalletBalance', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onAddAddresses() {
			try {
				if (!this.wallet || !this.wallet.id)
					throw new Error('unknown wallet');

				const added = {};
				let idx = 0;

				await saveAddresses(this.addresses.reduce((addrs, a) => {
					if (!added[a]) {
						addrs.push({
							address: a,
							index: idx++,
							wallet_id: this.wallet.id
						});
						added[a] = true;
					}

					return addrs;
				}, []));

				this.queueWallet(this.wallet.id);
				this.$emit('imported', this.addresses);
			} catch (ex) {
				console.error('onAddAddresses', ex.message);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onAddAddress() {
			if (this.adding)
				return;

			this.adding = true;

			try {
				this.addresses.unshift('');

				this.added = true;
			} catch (ex) {
				console.error('onAddPublicKey', ex);
				this.error = ex.message;
			} finally {
				this.adding = false;
			}
		}
	},
	watch: {
		addresses: {
			deep: true,
			handler: function() {
				try {
					clearTimeout(this.refreshTimeout);

					this.refreshTimeout = setTimeout(this.onRefreshWalletBalance, 300);
				} catch (ex) {
					console.error('AddressesWatchHandler', ex);
				}
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
		height: 36px;
		padding: 0 5px;
		font-size: 1.2rem;
		width: 100%;
		background: transparent;
		border-radius: 4px;
		border: 1px solid dark-gray;
		color: rgba(255, 255, 255, 0.84);
		outline: none;
		line-height: 36px;
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