<template>
	<div id="app">
		<div class="titlebar"></div>
		<primary-nav />
		<div class="page-wrapper">
			<transition name="fade" mode="out-in" appear>
				<version-mismatch v-if="uiRevision !== walletRevision && !ignoreVersionWarning" />
				<setup v-else-if="!setup" />
				<unavailable v-else-if="typeof unavailable === 'string'" />
				<unlock-wallet v-else-if="!unlocked" />
				<router-view v-else />
			</transition>
		</div>
		<notification-queue />
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import NotificationQueue from '@/components/NotificationQueue';
import PrimaryNav from '@/components/PrimaryNav';
import Setup from '@/views/Setup';
import Unavailable from '@/views/Unavailable.vue';
import UnlockWallet from '@/views/UnlockWallet';
import VersionMismatch from '@/views/VersionMismatch';

export default {
	components: {
		NotificationQueue,
		PrimaryNav,
		Setup,
		Unavailable,
		UnlockWallet,
		VersionMismatch
	},
	computed: {
		...mapState(['setup', 'wallets', 'autoLock', 'unavailable', 'walletRevision', 'ignoreVersionWarning']),
		unlocked() {
			return Array.isArray(this.wallets) && this.wallets.length !== 0;
		}
	},
	data() {
		return {
			autoLockTimeout: null
		};
	},
	mounted() {
		window.addEventListener('mousemove', this.resetAutoLock);
	},
	beforeDestroy() {
		window.removeEventListener('mousemove', this.resetAutoLock);
	},
	methods: {
		...mapActions(['lockWallets']),
		resetAutoLock() {
			let lockms = this.autoLock * 60000;

			if (lockms <= 0)
				lockms = 60000;

			clearTimeout(this.autoLockTimeout);

			this.autoLockTimeout = setTimeout(() => {
				if (!this.unlocked)
					return;

				this.lockWallets();
				this.pushNotification({
					message: this.translate('alerts.walletsLocked')
				});
			}, lockms);
		}
	}
};
</script>

<style lang="stylus">
@require "./styles/global";

.titlebar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 20px;
	-webkit-user-select: none;
	-webkit-app-region: drag;
	z-index: 1000;

	button {
		display: none;
	}
}

#app {
	width: 100%;
	height: 100%;

	@media screen and (min-width: 767px) {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
	}
}

.page-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
}

body.linux {
	.titlebar {
		display: none;
	}
}

body.win32 {
	.titlebar {
		height: 32px;

		button {
			display: inline-block;
			width: 46px;
			height: 32px;
			text-align: center;
			border: none;
			outline: none;
			background: none;
			font-family: "Segoe MDL2 Assets";
			font-size: 10px;
			color: rgba(255, 255, 255, 0.84);
			cursor: pointer;
			float: right;
			-webkit-app-region: none;

			&:hover, &:active, &:focus {
				color: primary;
			}
		}
	}
}
</style>
