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
		<div class="control" v-if="createType === 'recover'">
			<label>{{ translate('createWalletModal.lblRecoverySeed') }}</label>
			<textarea v-model="recoverySeed" />
		</div>
		<div class="buttons">
			<button class="btn btn-success btn-inline" @click="onCreateWallet" :disabled="creating">{{ buttonText }}</button>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import { generateSeed, generateAddresses } from '@/utils/sia';
import { randomBytes } from 'tweetnacl';
import { encode } from '@stablelib/base64';

export default {
	props: {
		createType: String
	},
	computed: {
		...mapState(['changeSeedType']),
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
		}
	},
	data() {
		return {
			creating: false,
			walletName: '',
			recoverySeed: '',
			seedType: 'sia'
		};
	},
	methods: {
		async generateWalletSeed() {
			switch (this.createType) {
			case 'ledger':
			case 'watch':
				return encode(randomBytes(64));
			case 'recover':
				await generateAddresses(this.recoverySeed, 0, 1);
				return this.recoverySeed;
			default:
				const seed = await generateSeed(this.seedType);
				await generateAddresses(seed, 0, 1);
				return seed;
			}
		},
		async onCreateWallet() {
			if (this.creating)
				return;

			this.creating = true;

			try {
				const seed = await this.generateWalletSeed();

				this.$emit('created', {
					seed,
					title: this.walletName,
					type: this.walletType
				});
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