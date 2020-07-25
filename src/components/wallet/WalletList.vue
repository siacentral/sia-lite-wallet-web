<template>
	<div class="wallets-list">
		<div class="wallets">
			<div class="wallet-group" v-for="group in groups" :key="group">
				<div class="group-title">{{ groupTitle(group) }}</div>
				<wallet-item
				v-for="wallet in walletGroups[group]" :key="wallet.id"
				:wallet="wallet"
				:active="wallet.id === active"
				@click.native="$emit('selected', wallet.id)" />
			</div>
		</div>
		<div class="wallet-buttons">
			<button class="btn wallet-btn" @click="showModal = true"><icon icon="plus" /> {{ translate('addWallet') }}</button>
		</div>
		<transition name="fade" mode="out-in" appear>
			<add-wallet-modal @close="showModal = false" v-if="showModal" />
		</transition>
	</div>
</template>

<script>
import AddWalletModal from '@/modal/AddWalletModal';
import WalletItem from '@/components/wallet/WalletItem';

export default {
	components: {
		AddWalletModal,
		WalletItem
	},
	props: {
		wallets: Array,
		active: String
	},
	data() {
		return {
			showModal: false
		};
	},
	computed: {
		groups() {
			const groups = Object.keys(this.walletGroups);

			groups.sort();

			return groups;
		},
		walletGroups() {
			return this.wallets.reduce((v, w) => {
				if (!v[w.currency])
					v[w.currency] = [];

				v[w.currency].push(w);

				return v;
			}, {});
		}
	},
	methods: {
		groupTitle(currency) {
			switch (currency) {
			case 'sc':
				return 'Siacoin (SC)';
			case 'scp':
				return 'ScPrimeCoin (SCP)';
			default:
				return currency;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.wallets-list {
	display: grid;
	grid-template-rows: minmax(0, 1fr) auto;
	grid-gap: 15px;
	overflow: hidden;
	min-width: 200px;
}

.wallets {
	overflow-x: hidden;
	overflow-y: auto;
}

.group-title {
	padding: 8px 15px;
	color: rgba(255, 255, 255, 0.54);
	border-top: 1px solid rgba(255, 255, 255, 0.12);
	border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.wallet-buttons {
	padding: 0 15px;
}

.btn.wallet-btn {
	display: block;
	background: transparent;
	border: 2px dashed rgba(255, 255, 255, 0.12);
	box-shadow: none;
	width: 100%;
	color: rgba(255, 255, 255, 0.54);

	&:active, &:hover, &:focus {
		color: primary;
		border-color: primary;
	}
}
</style>