<template>
	<div class="page page-unlock">
		<div class="page-content">
			<div class="page-icon"><icon icon="lock" /></div>
			<h2 class="text-center">{{ translate('unlockWallet') }}</h2>
			<p>{{ translate('unlockWalletModal.pWalletsLocked') }}</p>
			<form @submit.prevent="onUnlockWallets">
				<div class="control">
					<label>{{ translate('walletPassword') }}</label>
					<input type="password" v-model="password" />
				</div>
				<div class="buttons">
					<button class="btn btn-success btn-inline" :disabled="unlocking">{{ translate('unlock') }}</button>
				</div>
			</form>
		</div>
	</div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
	data() {
		return {
			password: '',
			unlocking: false
		};
	},
	methods: {
		...mapActions(['unlockWallets']),
		async onUnlockWallets() {
			if (this.unlocking)
				return;

			this.unlocking = true;

			try {
				await this.unlockWallets(this.password);
				this.pushNotification({
					icon: 'unlock',
					message: this.translate('alerts.unlockSuccess')
				});
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					icon: 'lock',
					message: this.translate('alerts.unlockError')
				});
				console.error('onUnlockWallets', ex);
			} finally {
				this.unlocking = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.page-unlock {
	position: fixed;
	background: bg-dark;
	z-index: 999;
}

h2, p {
	margin: 0;
}

.page-icon {
	text-align: center;
	color: primary;

	svg {
		width: 48px;
		height: auto;
	}
}

.page-content {
	display: grid;
	height: 100%;
	max-width: 700px;
	margin: auto;
	padding: 15px;
	grid-gap: 30px;
	align-content: safe center;
	overflow-x: hidden;
	overflow-y: auto;
}
</style>