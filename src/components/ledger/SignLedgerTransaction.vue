<template>
	<div>
		<connect-ledger class="connect-ledger" :connected="connected" @connected="onConnected" />
		<div class="app-status">
			<div>{{ translate('status') }}</div>
			<div />
			<div class="text-right">
				{{ connected ? 'Connected' : 'Not Connected' }}
				<template v-if="version">{{ version }}</template>
			</div>
			<template v-if="outdated">
				<div /><div />
				<div class="text-right text-error">{{ translate('ledger.outdated') }}</div>
			</template>
			<div>{{ translate('requiredSignatures') }}</div>
			<div />
			<div class="text-right">
				{{ formatNumber(signatures) }} / {{ formatNumber(sigIndices.length) }}
			</div>
			<div />
			<div class="text-right">
				<div class="control">
					<input type="checkbox" id="blindSign"
						:disabled="signing"
						v-model="blindSign" />
					<label for="blindSign">Use Blind Signing</label>
				</div>
			</div>
		</div>
		<div class="buttons">
			<button class="btn btn-success btn-inline"
				:disabled="signing || !connected"
				@click="onSignTransaction">{{ translate('sign') }}</button>
		</div>
	</div>
</template>

<script>
import { v2InputSigHash, encodeTransaction } from '@/sia';
import { formatNumber } from '@/utils/format';

import ConnectLedger from './ConnectLedger';

export default {
	components: {
		ConnectLedger
	},
	props: {
		currency: String,
		transaction: Object,
		changeIndex: Number,
		requiredSignatures: Array
	},
	data() {
		return {
			ledgerDevice: null,
			connected: false,
			signing: false,
			blindSign: false,
			signed: null,
			version: '',
			signatures: 0
		};
	},
	computed: {
		outdated() {
			if (!this.connected)
				return false;

			if (this.versionCmp(this.version, '0.4.3') < 0)
				return true;

			return false;
		},
		sigIndices() {
			return Array.from(new Set(this.requiredSignatures));
		}
	},
	beforeMount() {
		this.signed = { ...this.transaction };
		console.log(this.signed);
		console.log(this.requiredSignatures);
	},
	beforeDestroy() {
		if (this.ledgerDevice)
			this.ledgerDevice.close();
	},
	methods: {
		formatNumber,
		versionCmp(a, b) {
			const reg = /[^0-9.]/gi,
				aPieces = a.replace(reg, '').split('.'),
				bPieces = b.replace(reg, '').split('.'),
				len = Math.max(aPieces.length, bPieces.length);

			for (let i = 0; i < len; i++) {
				let as = 0, bs = 0;

				if (i < aPieces.length)
					as = parseInt(aPieces[i], 10);

				if (i < bPieces.length)
					bs = parseInt(bPieces[i], 10);

				if (isNaN(as))
					as = 0;

				if (isNaN(bs))
					bs = 0;

				if (as < bs)
					return -1;
				else if (as > bs)
					return 1;
			}

			return 0;
		},
		async onConnected(device) {
			try {
				this.ledgerDevice = device;
				this.connected = true;
				this.version = await this.ledgerDevice.getVersion();
			} catch (ex) {
				this.ledgerDevice.close();
				console.error('onConnected', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
				this.connected = false;
			}
		},
		async blindSignTransaction() {
			const sigHash = await v2InputSigHash(this.signed);
			for (const index of this.sigIndices) {
				const sig = await this.ledgerDevice.blindSign(sigHash, index);
				for (const input of this.signed.siacoinInputs || []) {
					if (input.index === index)
						input.satisfiedPolicy.signatures = [sig];
				}
				for (const input of this.signed.siafundInputs || []) {
					if (input.index === index)
						input.satisfiedPolicy.signatures = [sig];
				}
			}
		},
		async signTransaction() {
			const encoded = await encodeTransaction(this.signed);

			for (; this.signatures < this.requiredSignatures.length; this.signatures++)
				this.signed.signatures[this.signatures].signature = await this.ledgerDevice.signTransaction(encoded, this.signatures, this.requiredSignatures[this.signatures], this.changeIndex);
		},
		async onSignTransaction() {
			if (this.signing)
				return;

			this.signing = true;

			try {
				console.log(this.signed);
				if (!this.signed)
					throw new Error('no transaction to sign');
				else if (!this.ledgerDevice || !this.connected)
					throw new Error('ledger not connected');

				if (this.blindSign)
					await this.blindSignTransaction();
				else
					await this.signTransaction();

				this.$emit('signed', this.signed);
			} catch (ex) {
				console.error('onSignTransaction', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
			} finally {
				this.signing = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.connect-ledger {
	margin-bottom: 15px;
}

.app-status {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	grid-gap: 15px;
	padding: 15px 0;
	border-top: 1px solid dark-gray;
	border-bottom: 1px solid dark-gray;
	margin-bottom: 15px;
}
</style>