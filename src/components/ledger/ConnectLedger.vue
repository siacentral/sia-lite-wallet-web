<template>
	<div class="connect-ledger">
		<div class="step-icon"><icon :icon="icon" /></div>
		<div class="title">{{ translate('ledger.instructions') }}</div>
		<div class="control" v-if="supported.length > 1">
		<select v-model="mode" :disabled="connected">
			<option v-for="mode in supported" :value="mode" :key="mode">{{ friendlyMode(mode) }}</option>
		</select>
		</div>
		<div v-else />
		<button class="btn btn-inline btn-success" @click="onConnect" :disabled="connected">{{ translate('connect') }}</button>
		<transition name="fade-top" appear>
			<div class="text-error" v-if="error">{{ error }}</div>
		</transition>
	</div>
</template>

<script>
import { connect, supportedTransports } from '@/ledger/sia';
export default {
	props: {
		connected: Boolean
	},
	data() {
		return {
			error: null,
			mode: 'hid',
			supported: []
		};
	},
	async beforeMount() {
		this.supported = await supportedTransports();
		if (this.supported.length === 1)
			this.mode = this.supported[0];
	},
	computed: {
		icon() {
			switch (this.mode) {
			case 'ble':
				return ['fab', 'bluetooth-b'];
			default:
				return ['fab', 'usb'];
			}
		}
	},
	methods: {
		friendlyMode(mode) {
			switch (mode) {
			case 'hid':
				return 'USB';
			case 'ble':
				return 'Bluetooth';
			default:
				throw new Error('Unknown transport mode: ' + mode);
			}
		},
		async onConnect() {
			let sia;
			try {
				sia = await connect(this.mode);
				this.error = null;
				this.$emit('connected', sia);
			} catch (ex) {
				if (sia)
					sia.close();

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
	grid-template-columns: auto minmax(0, 1fr) repeat(2, auto);
	grid-gap: 15px;
	padding: 15px;
	align-items: center;
	border-radius: 4px;
	background: dark-gray;

	.text-error {
		grid-column: 1 / -1;
	}

	.control {
		margin: 0;
		padding: 0;
		border: 1px solid #676767;
		border-radius: 4px;
	}

	select {
		font-size: 1.1rem;
	}

	svg {
		width: 32px;
		height: 32px;
	}

	button {
		margin: 0;
	}
}
</style>