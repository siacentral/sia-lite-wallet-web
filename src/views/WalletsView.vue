<template>
	<div class="page wallet-page">
		<mobile-nav></mobile-nav>
		<div class="wallets-list">
			<div class="wallets">
				<div :class="{ 'wallet': true, 'active-wallet': selectedWallet === idx }" @click="selectedWallet = idx" v-for="(wallet, idx) in wallets" :key="wallet.id">
					<div class="wallet-name">{{ wallet.name || 'Wallet' }}</div>
					<div class="wallet-balance" v-html="getDisplayBalance(wallet)"></div>
				</div>
			</div>
			<div class="wallet-buttons">
				<button class="btn wallet-btn" @click="walletModal = 'addWallet'"><icon icon="plus" /> Add Wallet</button>
			</div>
		</div>
		<div class="wallets-detail">
			<transition name="fade-top" mode="out-in" appear>
				<wallet-display v-if="currentWallet" :wallet="currentWallet" :key="currentWallet.id" />
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
import { formatSiacoinString } from '@/utils/format';

import AddWalletModal from '@/modal/AddWalletModal';
import WalletDisplay from '@/components/wallet/WalletDisplay';
import MobileNav from '@/components/MobileNav';

export default {
	components: {
		AddWalletModal,
		WalletDisplay,
		MobileNav
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
		getDisplayBalance(wallet) {
			if (!wallet)
				return `0 <span class="currency-display">SC</span>`;

			const format = formatSiacoinString(wallet.unconfirmedBalance());

			return `${format.value} <span class="currency-display">${format.label}</span>`;
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

.wallet {
	position: relative;
    font-size: 1rem;
    text-align: right;
    padding: 15px;
	transition: all 0.3s linear;
	cursor: pointer;
	overflow: hidden;

	.wallet-name {
		font-size: 1.2rem;
		margin-bottom: 3px;
		color: rgba(255, 255, 255, 0.75);
	}

	.wallet-balance {
		color: rgba(255, 255, 255, 0.54);
	}

	&.active-wallet, &:hover, &:focus {
		.wallet-name {
			color: primary;
		}

		.wallet-balance {
			color: rgba(255, 255, 255, 0.75);
		}
	}
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