<template>
	<div class="page wallet-page">
		<mobile-nav />
		<div class="wallets-list">
			<div class="wallets">
				<wallet-item
					v-for="(wallet, i) in wallets" :key="wallet.id"
					:wallet="wallet"
					:active="walletActive(i)"
					@click.native="onSelectWallet(i)"/>
			</div>
			<div class="wallet-buttons">
				<button class="btn wallet-btn" @click="walletModal = 'addWallet'"><icon icon="plus" /> Add Wallet</button>
			</div>
		</div>
		<div class="wallets-detail">
			<transition name="fade-top" mode="out-in">
				<wallet-display v-if="currentWallet" :wallet="currentWallet"
					:key="currentWallet.id" @deleted="onDeleted" />
				<div v-else>
					No wallets found :(
				</div>
			</transition>
		</div>
		<transition name="fade" mode="out-in" appear>
			<add-wallet-modal @close="walletModal = null" v-if="walletModal === 'addWallet'" />
		</transition>
	</div>
</template>

<script>
import { mapState } from 'vuex';

import AddWalletModal from '@/modal/AddWalletModal';
import WalletItem from '@/components/wallet/WalletItem';
import WalletDisplay from '@/components/wallet/WalletDisplay';
import MobileNav from '@/components/MobileNav';

export default {
	components: {
		AddWalletModal,
		MobileNav,
		WalletDisplay,
		WalletItem
	},
	computed: {
		...mapState(['wallets', 'outputs']),
		currentWallet() {
			if (!Array.isArray(this.wallets) || this.wallets.length < this.selectedWallet)
				return null;

			return this.wallets[this.selectedWallet];
		}
	},
	data() {
		return {
			walletModal: null,
			selectedWallet: 0
		};
	},
	methods: {
		walletActive(i) {
			return this.selectedWallet === i;
		},
		onSelectWallet(i) {
			try {
				this.selectedWallet = i;
			} catch (ex) {
				console.error('onSelectWallet', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onDeleted() {
			try {
				this.selectedWallet = 0;
			} catch (ex) {
				console.error('onDeleted', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.page.wallet-page {
	display: grid;
	overflow: hidden;

	@media screen and (min-width: 767px) {
		grid-template-columns: minmax(auto, 200px) minmax(0, 1fr);
	}
}

.wallets-list {
	display: none;

	@media screen and (min-width: 767px) {
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		grid-gap: 15px;
		border-right: 2px solid primary;
		overflow: hidden;
	}
}

.wallets-detail {
	height: 100%;
	overflow: hidden;
}

.wallets {
	overflow-x: hidden;
	overflow-y: auto;
}

.wallet-buttons {
	padding: 0 15px 15px;
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