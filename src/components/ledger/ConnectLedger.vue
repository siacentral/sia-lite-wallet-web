<template>
	<div class="connect-ledger">
		<div class="step-icon"><icon :icon="['fab', 'usb']" /></div>
		<div class="title">{{ translate('ledger.instructions') }}</div>
		<button class="btn btn-inline btn-success" @click="onConnect" :disabled="connected">{{ translate('connect') }}</button>
		<transition name="fade-top" appear>
			<div class="text-error" v-if="error">{{ error }}</div>
		</transition>
	</div>
</template>

<script>
import { getVersion, close } from '@/ledger';

export default {
	props: {
		connected: Boolean
	},
	data() {
		return {
			error: null
		};
	},
	beforeDestroy() {
		close();
	},
	methods: {
		async onConnect() {
			try {
				this.error = null;
				await getVersion();
				this.$emit('connected', true);
			} catch (ex) {
				this.error = `Unable to connect to Ledger. Try reconnecting the device, opening the Sia App, using a different USB cable, and closing Ledger Live. (error: ${ex.message})`;
				console.error('onConnect', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
				this.$emit('connected', false);
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.connect-ledger {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	grid-gap: 15px;
	padding: 15px;
	align-items: center;
	border-radius: 4px;
	background: dark-gray;

	.text-error {
		grid-column: 1 / -1;
	}

	svg {
		width: 32px;
		height: auto;
	}

	button {
		margin: 0;
	}
}
</style>