<template>
	<modal @close="$emit('close')">
		<div class="control">
			<label>{{ translate('exportSeedModal.encryptionMode') }}</label>
			<select v-model="encryptionMode">
				<option value="none">{{ translate('exportSeedModal.optUnencrypted') }}</option>
				<option value="unlockPassword">{{ translate('exportSeedModal.optUnlockPassword') }}</option>
				<option value="customPassword">{{ translate('exportSeedModal.optCustomPassword') }}</option>
			</select>
		</div>
		<div class="control" v-if="encryptionMode === 'customPassword'">
			<label>{{ translate('unlockPassword') }}</label>
			<input type="password" v-model="customPassword" />
		</div>
		<div class="buttons">
			<button class="btn btn-inline btn-success" @click="onExportSeed" :disabled="!valid">{{ translate('export') }}</button>
		</div>
	</modal>
</template>

<script>
import { mapState } from 'vuex';
import { hash } from 'tweetnacl';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { exportSeed } from '@/utils/export';

import Modal from './Modal';

export default {
	components: {
		Modal
	},
	props: {
		wallet: Object
	},
	computed: {
		...mapState(['password']),
		valid() {
			return !this.exporting || (this.encryptionMode === 'customPassword' && this.customPassword.length === 0);
		},
		name() {
			if (!this.wallet || !this.wallet.title || this.wallet.title.length === 0)
				return 'Wallet';

			return this.wallet.title;
		}
	},
	data() {
		return {
			encryptionMode: 'unlockPassword',
			customPassword: '',
			exporting: false
		};
	},
	methods: {
		async onExportSeed() {
			if (!this.valid)
				return;

			this.exporting = true;

			try {
				let seed;

				switch (this.encryptionMode) {
				case 'none':
					seed = encodeUTF8(this.wallet.seed);
					break;
				case 'customPassword':
					seed = await exportSeed(this.wallet.seed, hash(encodeUTF8(this.customPassword)));
					break;
				default:
					seed = await exportSeed(this.wallet.seed, this.password);
					break;
				}

				this.downloadSeed(seed);
			} catch (ex) {
				console.error('onExportSeed', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'file-export',
					message: ex.message
				});
			} finally {
				this.exporting = false;
			}
		},
		downloadSeed(seed) {
			const link = document.createElement('a'),
				data = new Blob([seed]),
				objURL = URL.createObjectURL(data);

			link.style.display = 'none';

			link.setAttribute('href', objURL);
			link.setAttribute('download', `${this.name.toLowerCase()}.siaseed`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
};
</script>

<style lang="stylus" scoped>

</style>