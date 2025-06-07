<template>
	<div>
		<div class="control">
			<label>{{ translate('createWalletModal.lblWalletName') }}</label>
			<input type="text" :placeholder="translate('wallet')" v-model="walletName" />
		</div>
		<div class="control" v-if="createType === 'create'">
			<label>{{ translate('createWalletModal.lblSeedType') }}</label>
			<select v-model="seedType">
				<option value="walrus">BIP-39 Recovery Phrase</option>
				<option value="sia">Sia Recovery Phrase (Deprecated)</option>
			</select>
		</div>
		<template v-if="changeServerType">
			<div class="control" v-if="showServerURL">
				<label>{{ translate('createWalletModal.lblServerURL') }}</label>
				<input v-model="serverURL" />
			</div>
		</template>
		<template v-if="createType === 'recover'">
			<div class="buttons text-right">
				<button class="btn btn-inline" @click="importSeed = true">{{ translate('import') }}</button>
			</div>
			<div class="control">
				<label>{{ translate('createWalletModal.lblRecoverySeed') }}</label>
				<textarea v-model="recoverySeed" />
			</div>
		</template>
		<div class="buttons">
			<button class="btn btn-success btn-inline" @click="onCreateWallet" :disabled="creating">{{ buttonText }}</button>
		</div>
		<transition name="fade" mode="out-in" appear>
			<import-seed-modal v-if="importSeed" @close="importSeed = false" @import="onImportSeed" />
		</transition>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import { generateSeed, generateAddresses } from '@/sia';
import { randomBytes } from 'tweetnacl';
import { encode } from '@stablelib/base64';

import ImportSeedModal from '@/modal/ImportSeedModal';

export default {
	components: {
		ImportSeedModal
	},
	props: {
		createType: String
	},
	computed: {
		...mapState(['changeServerType']),
		walletType() {
			switch (this.createType) {
			case 'ledger':
			case 'watch':
				return this.createType;
			default:
				return 'default';
			}
		},
		buttonText() {
			switch (this.createType) {
			case 'ledger':
			case 'watch':
				return this.translate('import');
			case 'recover':
				return this.translate('recover');
			default:
				return this.translate('generate');
			}
		},
		showServerURL() {
			return false;
		}
	},
	data() {
		return {
			creating: false,
			importSeed: false,
			walletName: '',
			recoverySeed: '',
			currencyType: 'sc',
			seedType: 'walrus',
			serverType: 'siacentral',
			serverURL: null
		};
	},
	methods: {
		onImportSeed(seed) {
			try {
				this.recoverySeed = seed;
				this.importSeed = false;
			} catch (ex) {
				console.error('onImportSeed', ex);
			}
		},
		async generateWalletSeed() {
			let seed;

			switch (this.createType) {
			case 'ledger':
			case 'watch':
				seed = encode(randomBytes(64));
				break;
			case 'recover':
				await generateAddresses(this.recoverySeed, this.currencyType, 0, 1);
				seed = this.recoverySeed;
				break;
			default:
				seed = await generateSeed(this.seedType);
				await generateAddresses(seed, this.currencyType, 0, 1);
				break;
			}

			return seed;
		},
		async onCreateWallet() {
			if (this.creating)
				return;

			this.creating = true;

			try {
				const seed = await this.generateWalletSeed(),
					wallet = {
						seed,
						title: this.walletName,
						currency: this.currencyType,
						type: this.walletType,
						server_type: this.serverType,
						server_url: this.serverURL
					};
				this.$emit('created', wallet);
			} catch (ex) {
				console.error('onCreateWallet', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.creating = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>

</style>