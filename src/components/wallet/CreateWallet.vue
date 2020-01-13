<template>
	<transition name="fade-top" mode="out-in">
		<div class="wallet-step wallet-mode" v-if="step === 'choose'" key="pickMode">
			<div class="create-wallet-button" @click="onClickWalletType('create')">
				<div class="button-icon"><icon icon="plus" /></div>
				<div class="button-title">{{ translate('createWalletModal.newWallet') }}</div>
				<p>{{ translate('createWalletModal.pNewWalletExplain') }}</p>
			</div>
			<div class="create-wallet-button" @click="onClickWalletType('recover')">
				<div class="button-icon"><icon icon="redo" /></div>
				<div class="button-title">{{ translate('createWalletModal.recoverWallet') }}</div>
				<p>{{ translate('createWalletModal.pRecoverWalletExplain', seedWordPhrase) }}</p>
			</div>
			<div :class="hardwareBtnClasses" @click="onClickLedger">
				<div class="button-icon"><icon :icon="['fab', 'usb']" /></div>
				<div class="button-title">{{ translate('createWalletModal.ledgerWallet') }}</div>
				<p v-if="ledgerSupported">{{ translate('createWalletModal.pCreateLedgerExplain') }}</p>
				<p v-else>{{ translate('createWalletModal.pLedgerUnsupportedExplain') }}</p>
			</div>
			<div class="create-wallet-button" @click="onClickWalletType('watch')">
				<div class="button-icon"><icon icon="eye" /></div>
				<div class="button-title">{{ translate('createWalletModal.watchWallet') }}</div>
				<p>{{ translate('createWalletModal.pWatchWalletExplain') }}</p>
			</div>
		</div>
		<build-wallet v-else-if="step === 'create'" :createType="createType" @created="onWalletCreated" />
		<import-sia-addresses v-else-if="step === 'import'" key="import-sia" :wallet="wallet" @imported="onImportAddresses" />
		<div class="wallet-step" v-else-if="step === 'review'">
			<p v-if="walletType === 'ledger'">{{ translate('createWalletModal.pReviewLedger') }}</p>
			<p v-else-if="walletType === 'watch'">{{ translate('createWalletModal.pReviewWatch') }}</p>
			<p v-else-if="createType === 'recover'">{{ translate('createWalletModal.pReviewRecover') }}</p>
			<p v-else>{{ translate('createWalletModal.pReviewNew') }}</p>
			<div class="control" v-if="walletType === 'default'">
				<label>{{ translate('createWalletModal.lblRecoverySeed') }}</label>
				<textarea v-model="wallet.seed" readonly/>
			</div>
			<div class="controls">
				<button class="btn btn-success btn-inline" @click="onComplete" :disabled="saving">{{ translate('done') }}</button>
			</div>
		</div>
	</transition>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { generateAddresses } from '@/utils/sia';
import { saveAddresses } from '@/store/db';
import { ledgerSupported } from '@/utils/ledger';

import BuildWallet from '@/components/wallet/BuildWallet';
import ImportSiaAddresses from '@/components/addresses/ImportSiaAddresses';

export default {
	components: {
		BuildWallet,
		ImportSiaAddresses
	},
	computed: {
		...mapState(['password', 'changeSeedType']),
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		},
		hardwareBtnClasses() {
			return {
				'create-wallet-button': true,
				'create-button-disabled': !this.ledgerSupported
			};
		},
		seedWordPhrase() {
			return this.changeSeedType ? '12 or 29 word' : '29 word';
		}
	},
	data() {
		return {
			step: '',
			createType: '',
			saving: false,
			ledgerSupported: false,
			wallet: null,
			addresses: []
		};
	},
	async mounted() {
		this.ledgerSupported = await ledgerSupported();
		setTimeout(() => {
			this.step = 'choose';
		}, 300);
	},
	methods: {
		...mapActions(['createWallet']),
		onClickWalletType(type) {
			try {
				this.step = 'create';
				this.createType = type;
			} catch (ex) {
				console.error('onClickWalletType', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});
			}
		},
		onClickLedger() {
			try {
				if (!this.ledgerSupported)
					return;

				this.step = 'create';
				this.createType = 'ledger';
			} catch (ex) {
				console.error('onClickLedger', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});
			}
		},
		async onWalletCreated(wallet) {
			try {
				this.wallet = wallet;

				switch (wallet.type) {
				case 'ledger':
				case 'watch':
					this.step = 'import';
					break;
				default:
					this.saveWallet();

					this.step = 'review';
					break;
				}
			} catch (ex) {
				console.error('onWalletCreated', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});
			}
		},
		async saveWallet() {
			if (this.saving)
				return;

			this.saving = true;

			try {
				const walletID = await this.createWallet(this.wallet);

				this.wallet.id = walletID;

				switch (this.wallet.type) {
				case 'ledger':
				case 'watch':
					break;
				default:
					this.addresses = await generateAddresses(this.wallet.seed, 0, 10);
					break;
				}

				await saveAddresses(this.addresses.map(a => ({
					...a,
					wallet_id: walletID
				})));

				this.queueWallet(this.wallet.id, true);
			} catch (ex) {
				console.error('saveWallet', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});
			} finally {
				this.saving = false;
			}
		},
		onComplete() {
			this.$emit('created', this.wallet);
		},
		onImportAddresses(addresses) {
			try {
				this.addresses = addresses;

				this.saveWallet();

				this.step = 'review';
			} catch (ex) {
				console.error('onImportAddresses', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.header {
	padding: 15px;
	text-align: center;
	grid-column: 1 / -1;
}

.wallet-step {
	display: grid;
	height: 100%;
	width: 100%;
	padding: 15px;
	align-content: safe center;

	textarea {
		height: 80px;
	}
}

p {
	font-size: 1.2rem;
	margin-bottom: 30px;
}

.wallet-mode {
	grid-gap: 20px;

	@media screen and (min-width: 767px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.divider {
	height: 1px;
	background: dark-gray;
	grid-column: 1 / -1;
}

.create-wallet-button {
	width: 100%;
	padding: 15px;
	border: 1px solid dark-gray;
	border-radius: 4px;
	box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.14);
	transition: all 0.3s linear;

	&.create-button-disabled {
		opacity: 0.54;

		&:focus, &:active, &:hover {
			color: rgba(255, 255, 255, 0.54);
			border-color: dark-gray;
			cursor: pointer;
			box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.28);
		}
	}

	.button-icon {
		font-size: 2.4rem;
		text-align: center;
		margin-bottom: 15px;
	}

	.button-title {
		font-size: 1.2rem;
		text-align: center;
		margin-bottom: 15px;
	}

	p {
		color: rgba(255, 255, 255, 0.54);
		margin: 0;
	}

	&:focus, &:active, &:hover {
		color: primary;
		border-color: primary;
		cursor: pointer;
		box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.28);
	}
}

.controls {
	text-align: center;

	button {
		margin: 0;
	}
}
</style>