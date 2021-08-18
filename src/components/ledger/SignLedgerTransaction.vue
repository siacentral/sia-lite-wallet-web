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
				{{ formatNumber(signatures) }} / {{ formatNumber(requiredSignatures.length) }}
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
import { encodeTransaction } from '@/sia';
import { getVersion, signTransaction, signTransactionV044 } from '@/ledger';
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
			connected: false,
			signing: false,
			signed: null,
			version: '',
			signatures: 0
		};
	},
	computed: {
		outdated() {
			if (!this.connected)
				return false;

			if (this.versionCmp(this.version, '0.4.4') < 0)
				return true;

			return false;
		}
	},
	beforeMount() {
		this.signed = { ...this.transaction };
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
		async onConnected(connected) {
			try {
				this.connected = connected;

				if (this.connected)
					this.version = await getVersion();
			} catch (ex) {
				console.error('onConnected', ex);
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
				this.connected = false;
			}
		},
		async onSignTransaction() {
			if (this.signing)
				return;

			this.signing = true;

			try {
				if (!this.signed)
					throw new Error('no transaction to sign');

				const encoded = await encodeTransaction(this.signed),
					// compat: v0.4.5 introduces the change index to the sign txn ADPU
					signCompat = this.versionCmp(this.version, '0.4.5') < 0;

				console.log(this.version, this.changeIndex, this.versionCmp(this.version, '0.4.5'));

				for (; this.signatures < this.requiredSignatures.length; this.signatures++) {
					let sig;
					if (signCompat)
						sig = await signTransactionV044(encoded, this.signatures, this.requiredSignatures[this.signatures]);
					else
						sig = await signTransaction(encoded, this.signatures, this.requiredSignatures[this.signatures], this.changeIndex);

					this.signed.transactionsignatures[this.signatures].signature = sig;
				}

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