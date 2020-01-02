<template>
	<modal @close="$emit('close')">
		<button href="#" class="close-btn" @click="$emit('close')"><icon icon="times" /></button>
		<create-wallet @created="$emit('close')" />
	</modal>
</template>

<script>
import Modal from './Modal';
import CreateWallet from '@/components/wallet/CreateWallet';

export default {
	components: {
		CreateWallet,
		Modal
	}
};
</script>