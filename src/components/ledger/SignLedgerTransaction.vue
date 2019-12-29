<template>
	<div>
		<connect-ledger class="connect-ledger" :connected="connected" @connected="onConnected" />
		<div class="app-status">
			<div>Status</div>
			<div />
			<div class="text-right">
				{{ connected ? 'Connected' : 'Not Connected' }}
				<template v-if="version">{{ version }}</template>
			</div>
			<div>Required Signatures</div>
			<div />
			<div class="text-right">
				{{ formatNumber(signatures) }} / {{ formatNumber(requiredSignatures.length) }}
			</div>
		</div>
		<div class="buttons">
			<button class="btn btn-success btn-inline"
				:disabled="signing || !connected"
				@click="onSignTransaction">Sign</button>
		</div>
	</div>
</template>

<script>
import { encodeTransaction } from '@/utils/sia';
import { getVersion, signTransaction } from '@/utils/ledger';
import { formatNumber } from '@/utils/format';

import ConnectLedger from './ConnectLedger';

export default {
	components: {
		ConnectLedger
	},
	props: {
		transaction: Object,
		requiredSignatures: Array
	},
	data() {
		return {
			connected: false,
			signing: false,
			version: '',
			signatures: 0
		};
	},
	methods: {
		formatNumber,
		async onConnected(err) {
			try {
				if (err) {
					this.connected = false;
					this.error = err;
					return;
				}

				this.version = await getVersion();
				this.connected = true;
			} catch (ex) {
				console.error('onConnected', ex);
				this.connected = false;
			}
		},
		async onSignTransaction() {
			if (this.signing)
				return;

			this.signing = true;
			this.signed = JSON.parse(JSON.stringify(this.transaction));

			try {
				if (!this.transaction)
					throw new Error('no transaction to sign');

				const signed = { ...this.transaction },
					encoded = await encodeTransaction(signed);

				for (; this.signatures < this.requiredSignatures.length; this.signatures++) {
					const sig = await signTransaction(encoded, this.signatures,
						this.requiredSignatures[this.signatures]);

					signed.transactionsignatures[this.signatures].signature = sig;
				}

				this.$emit('signed', signed);
			} catch (ex) {
				console.error('onSignTransaction', ex);
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

.buttons {
	text-align: center;

	button {
		margin: 0;
	}
}
</style>