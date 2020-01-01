<template>
	<modal @close="$emit('close')">
		<import-ledger-addresses v-if="wallet.type === 'ledger'" :wallet="wallet" @imported="onImportAddresses" />
		<import-watch-addresses  v-else-if="wallet.type === 'watch'" :wallet="wallet" @imported="onImportAddresses" />
	</modal>
</template>

<script>
import ImportLedgerAddresses from '@/components/ledger/ImportLedgerAddresses';
import ImportWatchAddresses from '@/components/watch/ImportWatchAddresses';
import Modal from './Modal';

export default {
	components: {
		ImportLedgerAddresses,
		ImportWatchAddresses,
		Modal
	},
	props: {
		wallet: Object
	},
	methods: {
		onImportAddresses() {
			try {
				this.$emit('close');
				this.pushNotification({
					icon: 'redo',
					message: 'Addresses added. Wallet scan queued.'
				});
			} catch (ex) {
				console.error('onImportAddresses', ex);
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

</style>