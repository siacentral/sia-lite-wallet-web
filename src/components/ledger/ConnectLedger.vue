<template>
	<div class="connect-ledger">
		<div class="step-icon"><icon :icon="['fab', 'usb']" /></div>
		<div class="title">Unlock your Ledger device and open the Sia App</div>
		<button class="btn btn-inline btn-success" @click="onConnect" :disabled="connected">Connect</button>
	</div>
</template>

<script>
import { ledgerSupported, getVersion } from '@/utils/ledger';

export default {
	props: {
		connected: Boolean
	},
	computed: {
		ledgerSupported() {
			return ledgerSupported();
		}
	},
	methods: {
		async onConnect() {
			try {
				await getVersion();
				this.$emit('connected', null);
			} catch (ex) {
				console.error('onConnect', ex);
				this.$emit('connected', ex.message);
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

	svg {
		width: 32px;
		height: auto;
	}

	button {
		margin: 0;
	}
}
</style>