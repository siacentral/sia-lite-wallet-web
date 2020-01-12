<template>
	<modal @close="$emit('close')">
		<div class="file-control" @click="onBrowseSeed" @drop.prevent="onFileDrop" @dragover.prevent>
			<icon icon="file" />
			<label v-if="file">Importing {{ fileName }}</label>
			<label v-else>Drag and drop a Sia seed file or click to select a file</label>
			<input type="file" id="import-file-input" ref="fileInput" @change="onFileSelect" />
		</div>
		<div class="control" v-if="seedEncrypted">
			<label>Password</label>
			<input type="password" v-model="customPassword" />
		</div>
		<div class="buttons">
			<button class="btn btn-inline btn-success" @click="onImportSeed" :disabled="!valid">Import</button>
		</div>
	</modal>
</template>

<script>
import { mapState } from 'vuex';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { hash } from 'tweetnacl';
import { importSeed } from '@/utils/export';

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
			return !this.importing && this.file && this.file.length !== 0 &&
				(!this.seedEncrypted || this.customPassword.length !== 0);
		},
		seedEncrypted() {
			return this.file && !this.decryptedSeed;
		}
	},
	data() {
		return {
			seedPath: '',
			fileName: '',
			file: null,
			decryptedSeed: null,
			encryptionMode: 'unlockPassword',
			customPassword: '',
			importing: false
		};
	},
	methods: {
		async loadImportFile(file) {
			const data = new Uint8Array(await file.arrayBuffer()),
				name = file.name;

			try {
				this.decryptedSeed = await importSeed(data, this.password);
			} catch (ex) { console.warn('seed imported with custom password'); }

			this.file = data;
			this.fileName = name;
		},
		async onFileDrop(e) {
			try {
				const file = e.dataTransfer.files[0];

				if (!file)
					throw new Error('no files selected');

				await this.loadImportFile(file);
			} catch (ex) {
				console.error('onFileDrop', ex);
			}
		},
		async onFileSelect() {
			try {
				const file = this.$refs.fileInput.files[0];

				if (!file)
					throw new Error('no files selected');

				await this.loadImportFile(file);
			} catch (ex) {
				console.error('onFileSelect', ex);
			}
		},
		async onBrowseSeed() {
			try {
				this.$refs.fileInput.click();
			} catch (ex) {
				console.error('onBrowseSeed', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onImportSeed() {
			if (!this.valid)
				return;

			this.importing = true;

			try {
				if (!this.decryptedSeed)
					this.decryptedSeed = await importSeed(this.file, hash(encodeUTF8(this.customPassword)));

				this.$emit('import', this.decryptedSeed);
			} catch (ex) {
				console.error('onExportSeed', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'file-import',
					message: ex.message
				});
			} finally {
				this.importing = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.file-control {
	display: grid;
	text-align: center;
	min-height: 10vh;
	padding: 15px;
	align-items: center;
	justify-items: center;
	border: 1px dashed dark-gray;
	grid-gap: 15px;
	margin-bottom: 15px;
	border-radius: 4px;

	svg {
		color: rgba(255, 255, 255, 0.54);
		width: 32px;
		height: auto;
	}

	input {
		display: none;
	}
}
</style>