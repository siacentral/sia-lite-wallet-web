<template>
	<div class="page wallet-page">
		<mobile-nav />
		<wallet-list class="wallets-list"
			:wallets="wallets"
			:active="selectedWallet"
			@selected="onWalletSelected" />
		<div class="wallets-detail">
			<transition name="fade-top" mode="out-in">
				<wallet-display
					v-if="currentWallet"
					:wallet="currentWallet"
					:wallets="wallets"
					:active="selectedWallet"
					:key="currentWallet.id"
					@deleted="onDeleted"
					@selected="onWalletSelected" />
			</transition>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';

import WalletList from '@/components/wallet/WalletList';
import WalletDisplay from '@/components/wallet/WalletDisplay';
import MobileNav from '@/components/MobileNav';

export default {
	components: {
		WalletDisplay,
		WalletList,
		MobileNav
	},
	computed: {
		...mapState(['wallets', 'outputs']),
		currentWallet() {
			if (!Array.isArray(this.wallets))
				return null;

			const selected = this.wallets.filter(w => w.id === this.selectedWallet)[0];

			if (!selected)
				return this.wallets[0];

			return selected;
		}
	},
	data() {
		return {
			walletModal: null,
			selectedWallet: null
		};
	},
	mounted() {
		this.selectedWallet = localStorage.getItem('lastSelectedWallet') || this.wallets[0].id;
	},
	methods: {
		onWalletSelected(id) {
			try {
				this.selectedWallet = id;
				localStorage.setItem('lastSelectedWallet', id);
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
				this.selectedWallet = this.wallets[0].id;
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
.wallets-list {
	display: none;
	border-right: 2px solid primary;
	padding-bottom: 15px;

	@media screen and (min-width: 767px) {
		display: grid;
	}
}

.page.wallet-page {
	display: grid;
	overflow: hidden;

	@media screen and (min-width: 767px) {
		grid-template-columns: auto minmax(0, 1fr);
	}
}

.wallets-detail {
	height: 100%;
	overflow: hidden;
}
</style>