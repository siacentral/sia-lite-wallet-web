<template>
	<div>
		<div class="control">
			<label>{{ translate('createWalletModal.lblWalletName') }}</label>
			<input type="text" :placeholder="translate('wallet')" v-model="walletName" />
		</div>
		<div class="control" v-if="createType === 'create' && changeSeedType">
			<label>{{ translate('createWalletModal.lblSeedType') }}</label>
			<select v-model="seedType">
				<option value="sia">{{ translate('createWalletModal.siaSeed') }}</option>
				<option value="walrus">{{ translate('createWalletModal.walrusSeed') }}</option>
			</select>
		</div>
		<div class="control">
			<label>{{ translate('createWalletModal.lblCurrencyType') }}</label>
			<select v-model="currencyType">
				<option value="sc">{{ translate('siacoin') }}</option>
				<option value="scp">{{ translate('scprimecoin') }}</option>
			</select>
		</div>
		<transition name="fade" appear>
			<p v-if="createType === 'ledger' && currencyType === 'scp'" class="text-small text-warning">{{ translate('ledgerSCPWarning') }} <a href="https://gitlab.com/n8maninger/nanos-app-scprime" target="_blank">https://gitlab.com/n8maninger/nanos-app-scprime</a></p>
		</transition>
		<template v-if="changeServerType">
			<div class="control">
				<label>{{ translate('createWalletModal.lblServerType') }}</label>
				<select v-model="serverType">
					<option value="siacentral">{{ translate('siacentral') }}</option>
					<option value="narwal">{{ translate('narwal') }}</option>
					<option value="walrus">{{ translate('walrus') }}</option>
				</select>
			</div>
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
import { hashString } from '@/utils/crypto';
import WalrusClient from '@/api/walrus';

import ImportSeedModal from '@/modal/ImportSeedModal';

export default {
	components: {
		ImportSeedModal
	},
	props: {
		createType: String
	},
	computed: {
		...mapState(['changeSeedType', 'changeServerType']),
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
			if (this.serverType === 'walrus')
				return true;

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
			seedType: 'sia',
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

				// narwal wallets are walrus
				if (this.serverType === 'narwal') {
					wallet.server_type = 'walrus';

					// automatically generate a new narwal url
					switch (this.createType) {
					default:
						wallet.server_url = `https://narwal.lukechampine.com/wallet/${hashString(seed)}`;
						break;
					}
				}

				// check the server connection
				if (wallet.server_type === 'walrus') {
					let addresses = [];
					try {
						const client = new WalrusClient(wallet.server_url);

						addresses = await client.getAddresses();
					} catch (ex) {
						console.warn('BuildWallet.onCreateWallet', ex.message);
						throw new Error('Unable to connect to Walrus server. Check your URL.');
					}

					if (this.createType === 'create' && addresses.length !== 0)
						throw new Error('That walrus server is already in use. Choose "Recover Wallet" to import an existing seed');
				}

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