<template>
	<div class="page page-setup">
		<transition name="fade-top" mode="out-in" appear>
			<div class="setup-step" v-if="step === 0" key="start">
				<div class="setup-icon">
					<sia-central />
				</div>
				<h2>{{ translate('setup.welcomeHeader') }}</h2>
				<div class="setup-content">
					<p>{{ translate('setup.welcome1') }}</p>
					<p>{{ translate('setup.welcome2') }}</p>
					<p>{{ translate('setup.welcome3') }}</p>
					<p>{{ translate('setup.welcome4') }}</p>
					<div class="control">
						<label>{{ translate('settings.lblDisplayLanguage') }}</label>
						<select v-model="newLanguage" @change="setDisplayLanguage(newLanguage)">
							<option v-for="language in languages" :key="language" :value="language">{{ translate(`language.${language}`) }}</option>
						</select>
					</div>
					<div class="buttons">
						<button class="btn btn-success btn-inline" @click="step = 1">{{ translate('getStarted') }}</button>
					</div>
				</div>
			</div>
			<div class="setup-step" v-else-if="step === 1" key="password">
				<div class="setup-icon">
					<sia-central />
				</div>
				<h2>{{ translate('setup.passwordHeader') }}</h2>
				<div class="setup-content">
					<p>{{ translate('setup.password1') }}</p>
					<p>{{ translate('setup.password2') }}</p>
					<div class="control">
						<label>{{ translate('unlockPassword') }}</label>
						<input type="password" v-model="unlockPassword" />
					</div>
					<div class="buttons">
						<button class="btn btn-success btn-inline" @click="onSetPassword" :disabled="unlockPassword.length === 0">{{ translate('next') }}</button>
					</div>
				</div>
			</div>
			<create-wallet class="setup-step" v-else-if="step === 2" key="create" @created="onWalletCreated" />
		</transition>
		<div class="extra-links">
			<a href="https://github.com/siacentral/sia-lite-wallet"><icon :icon="['fab', 'github']" /></a>
			<a href="https://siacentral.com"><sia-central /></a>
			<a href="https://sia.tech"><built-with-sia /></a>
		</div>
	</div>
</template>

<script>
import { languages, languageSupported } from '@/translation';
import { mapActions } from 'vuex';

import CreateWallet from '@/components/wallet/CreateWallet';
import SiaCentral from '@/assets/siacentral.svg';
import BuiltWithSia from '@/assets/built-with-sia.svg';

export default {
	components: {
		CreateWallet,
		BuiltWithSia,
		SiaCentral
	},
	computed: {
		languages() {
			return languages;
		}
	},
	data() {
		return {
			step: null,
			unlockPassword: '',
			newLanguage: null
		};
	},
	beforeMount() {
		this.newLanguage = (navigator.language || '').slice(0, 2);

		if (!languageSupported(this.newLanguage))
			this.newLanguage = 'en';
	},
	mounted() {
		setTimeout(() => {
			this.step = 0;
		}, 500);
	},
	methods: {
		...mapActions(['setPassword', 'setSetup', 'setDisplayLanguage']),
		onSetPassword() {
			try {
				if (this.unlockPassword.length === 0)
					return;

				this.setPassword(this.unlockPassword);
				this.step = 2;
			} catch (ex) {
				console.error('onSetPassword', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: ex.message
				});
			}
		},
		onWalletCreated() {
			try {
				this.setSetup(true);
			} catch (ex) {
				console.error('onWalletCreated', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'wallet',
					message: ex.message
				});
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.page-setup {
	position: fixed;
	background: bg-dark;
	z-index: 999;
}

h2 {
	margin: 0;
	text-align: center;
	color: primary;
}

p {
	margin-top: 0;
	margin-bottom: 20px;
	font-size: 1.1rem;
}

.setup-step {
	display: grid;
	height: 100%;
	max-width: 700px;
	margin: auto;
	padding: 50px 15px;
	grid-gap: 15px;
	align-content: safe center;
}

.setup-icon {
	width: 64px;
	height: auto;
	margin: auto;
}

.setup-content {
	overflow-x: hidden;
	overflow-y: auto;
}

.extra-links {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 15px;
	text-align: center;

	a {
		color: rgba(255, 255, 255, 0.54);
		margin: 0 15px;

		svg {
			width: 28px;
			height: auto;

			g path {
				stroke: rgba(255, 255, 255, 0.54) !important;
			}
		}
	}
}
</style>