<template>
	<modal @close="$emit('close')">
		<div class="wallets">
			<wallet-list class="wallets-list"
				:wallets="wallets"
				:active="selectedWallet"
				@selected="(i) => $emit('selected', i)" />
		</div>
	</modal>
</template>

<script>
import Modal from './Modal';
import WalletList from '@/components/wallet/WalletList';

export default {
	components: {
		Modal,
		WalletList
	},
	props: {
		wallets: Array,
		active: Number
	}
};
</script>

<style lang="stylus" scoped>
.wallets {
	height: 100%;
}

.wallets-list {
	height: 100%;
}
</style>