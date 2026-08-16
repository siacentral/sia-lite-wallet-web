<template>
	<modal @close="$emit('close')">
		<create-wallet @created="$emit('close')" />
	</modal>
</template>

<script>
import Modal from './Modal';
import CreateWallet from '@/components/wallet/CreateWallet';

export default {
	emits: ['close'],
	components: {
		CreateWallet,
		Modal
	}
};
</script>