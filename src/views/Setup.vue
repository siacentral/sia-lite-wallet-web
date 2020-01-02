<template>
	<div class="page page-setup">
		<transition name="fade-top" mode="out-in" appear>
			<div class="setup-step" v-if="step === 0" key="start">
				<div class="setup-icon">
					<sia-central />
				</div>
				<h2>Welcome to Sia Lite Wallet</h2>
				<div class="setup-content">
					<p>Thank you for trying out Sia Lite Wallet by Sia Central. This wallet is
						currently under development. If you find run into any
						issues or would like to submit feedback please create an issue on
						<a href="https://github.com/siacentral/sia-lite" target="_blank">GitHub</a>.
						</p>
					<p>This wallet is completely secure. All wallet seeds are encrypted, stored locally
						and never leave the device. They cannot be viewed by anyone without access
						to the device and the unlock password.</p>
					<p>Please use caution when sending or receiving Siacoins to prevent coin loss.
						Sia Central is not responsible for any damages incurred while using this
						wallet.</p>
					<p>This wallet is unofficial and is not associated with NebulousLabs or the core
						Sia team.</p>
					<div class="buttons">
						<button class="btn btn-success btn-inline" @click="step = 1">Get Started</button>
					</div>
				</div>
			</div>
			<div class="setup-step" v-else-if="step === 1" key="password">
				<div class="setup-icon">
					<sia-central />
				</div>
				<h2>Set a Password</h2>
				<div class="setup-content">
					<p>Please set a secure password to encrypt your wallets with. This password will
						be required to unlock and use your wallets.</p>
					<p>All wallet seeds are encrypted, stored locally and never leave the device.
						They cannot be viewed by anyone without access to the device and the
						unlock password.</p>
					<div class="control">
						<label>Unlock Password</label>
						<input type="password" v-model="unlockPassword" />
					</div>
					<div class="buttons">
						<button class="btn btn-success btn-inline" @click="onSetPassword" :disabled="unlockPassword.length === 0">Next</button>
					</div>
				</div>
			</div>
			<create-wallet class="setup-step" v-else-if="step === 2" key="create" @created="onWalletCreated" />
		</transition>
	</div>
</template>

<script>
import { mapActions } from 'vuex';

import CreateWallet from '@/components/wallet/CreateWallet';
import SiaCentral from '@/assets/siacentral.svg';

export default {
	components: {
		CreateWallet,
		SiaCentral
	},
	data() {
		return {
			step: null,
			unlockPassword: ''
		};
	},
	mounted() {
		setTimeout(() => {
			this.step = 0;
		}, 500);
	},
	methods: {
		...mapActions(['setPassword', 'setSetup']),
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
	padding: 15px;
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
</style>