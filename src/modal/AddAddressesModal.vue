<template>
	<modal @close="$emit('close')">
		<import-sia-addresses :wallet="wallet" @imported="onImportAddresses" />
	</modal>
</template>

<script>
import { saveAddresses } from '@/store/db';

import ImportSiaAddresses from '@/components/addresses/ImportSiaAddresses';
import Modal from './Modal';

export default {
	components: {
		ImportSiaAddresses,
		Modal
	},
	props: {
		wallet: Object
	},
	methods: {
		async onImportAddresses(addresses) {
			try {
				await saveAddresses(addresses.map(a => ({
					...a,
					wallet_id: this.wallet.id
				})));

				this.$emit('close');
				this.pushNotification({
					icon: 'redo',
					message: this.translate('alerts.addressesAdded')
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