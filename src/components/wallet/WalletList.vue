<template>
	<div class="wallets-list">
		<div class="wallets">
			<wallet-item
				v-for="(wallet, i) in wallets" :key="wallet.id"
				:wallet="wallet"
				:active="active === i"
				@click.native="$emit('selected', i)" />
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
		active: Number
	},
	data() {
		return {
			showModal: false
		};
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