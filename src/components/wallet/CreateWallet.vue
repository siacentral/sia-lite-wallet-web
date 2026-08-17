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
				<p>{{ translate('createWalletModal.pRecoverWalletExplain') }}</p>
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
			<div class="controls">
				<button class="btn btn-success btn-inline" @click="onComplete" :disabled="saving">{{ translate('done') }}</button>
			</div>
		</div>
		<div class="wallet-step wallet-seed-step" v-else-if="step === 'reveal'">
			<p v-if="createType === 'recover'">{{ translate('createWalletModal.pReviewRecover') }}</p>
			<p v-else>{{ translate('createWalletModal.pReviewNew') }}</p>
			<h3 class="text-warning">{{ translate('createWalletModal.revealSeed') }}</h3>
			<seed-phrase-input :words="revealWords" :count="revealWords.length" readonly />
			<div class="controls text-right">
				<button class="btn btn-inline" @click="exportSeed = true">{{ translate('export') }}</button>
			</div>
			<div class="control">
				<input type="checkbox" id="chkSeedExported" v-model="exported" />
				<label for="chkSeedExported">{{ translate('createWalletModal.iHaveWrittenDown') }}</label>
			</div>
			<div class="controls">
				<button class="btn btn-success btn-inline" @click="onToConfirm" :disabled="!exported || saving">{{ translate('confirm') }}</button>
			</div>
			<transition name="fade" mode="out-in" appear>
				<export-seed-modal v-if="exportSeed" :wallet="wallet" @close="exportSeed = false" />
			</transition>
		</div>
		<div class="wallet-step wallet-seed-step" v-else-if="step === 'confirm'">
			<p>{{ translate('createWalletModal.' + (createType === 'recover' ? 'confirmRecover' : 'confirmNew')) }}</p>
			<seed-phrase-input v-if="seedWordCount === 12" :count="seedWordCount" @editing="onConfirmEditing" @input="onConfirmInput" />
			<textarea
				v-else
				v-model="confirmPhrase"
				:aria-label="translate('createWalletModal.confirmSeed')"
				@input="onConfirmEditing(confirmPhrase)"
				@change="onConfirmInput(confirmPhrase)"
			/>
			<div class="confirm-feedback" role="status" aria-live="polite">
				<span v-if="saving" class="text-warning">{{ translate('createWalletModal.savingWallet') }}</span>
				<span v-else-if="confirmValidating" class="text-warning">{{ translate('createWalletModal.validating') }}</span>
				<span v-else-if="confirmValid" class="text-success">{{ translate('createWalletModal.seedConfirmed') }}</span>
				<span v-else-if="confirmError" class="text-error">{{ translate('createWalletModal.seedInvalid') }}</span>
				<span v-else>{{ translate('createWalletModal.confirmProgress', confirmWordCount, seedWordCount) }}</span>
			</div>
			<div class="controls">
				<button class="btn btn-success btn-inline" @click="onComplete" :disabled="!confirmValid || saving || confirmValidating">{{ saving ? translate('createWalletModal.savingWallet') : translate('done') }}</button>
			</div>
		</div>
	</transition>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { generateAddresses } from '@/sia';
import { saveAddresses } from '@/store/db';
import { supportedTransports } from '@/ledger/sia';

import BuildWallet from '@/components/wallet/BuildWallet';
import ExportSeedModal from '@/modal/ExportSeedModal';
import ImportSiaAddresses from '@/components/addresses/ImportSiaAddresses';
import SeedPhraseInput from '@/components/wallet/SeedPhraseInput';
import { WORD_MAP } from '@/sia/bip39';

export default {
	components: {
		BuildWallet,
		ExportSeedModal,
		ImportSiaAddresses,
		SeedPhraseInput
	},
	emits: ['created'],
	computed: {
		...mapState(['password', 'changeSeedType']),
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		},
		revealWords() {
			return this.wallet && this.wallet.seed ? String(this.wallet.seed).split(' ') : [];
		},
		seedWordCount() {
			return this.wallet && this.wallet.seed ? String(this.wallet.seed).split(' ').length : 0;
		},
		confirmWordCount() {
			const phrase = this.confirmPhrase.trim();

			if (phrase === '')
				return 0;

			const words = phrase.split(/\s+/);

			if (this.seedWordCount === 12)
				return words.filter(word => WORD_MAP.has(word)).length;

			return Math.min(words.length, this.seedWordCount);
		},
		hardwareBtnClasses() {
			return {
				'create-wallet-button': true,
				'create-button-disabled': !this.ledgerSupported
			};
		}
	},
	data() {
		return {
			step: '',
			createType: '',
			exportSeed: false,
			exported: false,
			saving: false,
			ledgerSupported: false,
			wallet: null,
			addresses: [],
			confirmPhrase: '',
			confirmValid: false,
			confirmValidating: false,
			confirmError: null
		};
	},
	async mounted() {
		this.ledgerSupported = (await supportedTransports()).length > 0;
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
					this.exported = false;
					this.confirmPhrase = '';
					this.confirmValid = false;
					this.confirmError = null;
					this.addresses = await generateAddresses(this.wallet.seed, 0, 10);
					this.step = 'reveal';
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
				return false;

			this.saving = true;

			try {
				const walletID = await this.createWallet(this.wallet);

				this.wallet.id = walletID;

				switch (this.wallet.type) {
				case 'ledger':
				case 'watch':
					break;
				default:
					if (this.addresses.length === 0)
						this.addresses = await generateAddresses(this.wallet.seed, 0, 10);
					break;
				}

				await saveAddresses(this.addresses.map(a => ({
					...a,
					wallet_id: walletID
				})));

				this.queueWallet(this.wallet.id, true);

				return true;
			} catch (ex) {
				console.error('saveWallet', ex);
				this.pushNotification({
					message: ex.message,
					severity: 'danger'
				});

				return false;
			} finally {
				this.saving = false;
			}
		},
		onToConfirm() {
			if (!this.exported || this.saving)
				return;

			this.confirmPhrase = '';
			this.confirmValid = false;
			this.confirmValidating = false;
			this.confirmError = null;
			this.exportSeed = false;
			this.step = 'confirm';
		},
		onConfirmEditing(phrase) {
			this.confirmPhrase = phrase;
			this.confirmValid = false;
			this.confirmValidating = false;
			this.confirmError = null;
		},
		async onConfirmInput(phrase) {
			const normalizedPhrase = phrase.trim().split(/\s+/).join(' '),
				wordCount = normalizedPhrase === '' ? 0 : normalizedPhrase.split(' ').length;

			this.confirmPhrase = normalizedPhrase;

			if (wordCount !== this.seedWordCount) {
				this.confirmValid = false;
				this.confirmValidating = false;
				this.confirmError = null;
				return;
			}

			this.confirmValidating = true;
			this.confirmError = null;

			try {
				const addresses = await generateAddresses(normalizedPhrase, 0, 1),
					originalAddress = this.addresses[0] && this.addresses[0].address,
					confirmedAddress = addresses[0] && addresses[0].address;

				if (this.confirmPhrase !== normalizedPhrase)
					return;

				this.confirmValid = originalAddress !== undefined && confirmedAddress === originalAddress;
				this.confirmError = this.confirmValid ? null : 'mismatch';
			} catch {
				if (this.confirmPhrase !== normalizedPhrase)
					return;

				this.confirmValid = false;
				this.confirmError = 'invalid';
			} finally {
				if (this.confirmPhrase === normalizedPhrase)
					this.confirmValidating = false;
			}
		},
		async onComplete() {
			if (this.saving)
				return;

			if (this.walletType === 'default') {
				if (!this.confirmValid || !await this.saveWallet())
					return;
			}

			this.$emit('created', this.wallet);
		},
		async onImportAddresses(addresses) {
			try {
				this.addresses = addresses;

				if (await this.saveWallet())
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

.wallet-seed-step {
	grid-row-gap: 15px;

	> p, > h3 {
		margin-bottom: 0;
	}

	.controls {
		padding: 8px 0;

		.btn {
			padding: 10px 18px;
		}
	}
}

.confirm-feedback {
	display: flex;
	height: 36px;
	align-items: center;
	justify-content: center;
	text-align: center;
	color: rgba(255, 255, 255, 0.54);
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
