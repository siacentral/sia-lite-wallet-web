<template>
	<modal @close="$emit('close')">
		<transition name="fade-top" mode="out-in" appear>
			<div class="receive-grid" v-show="loaded" key="receive">
				<div v-if="walletType === 'ledger'" class="ledger-verify">
					<connect-ledger :connected="connected" @connected="onConnected" />
				</div>
				<button class="btn-prev" @click="onChangeAddress(-1)"><icon icon="chevron-left" /></button>
				<address-qr-code class="qr-display" :address="currentAddress" />
				<button class="btn-next" @click="onChangeAddress(1)"><icon icon="chevron-right" /></button>
				<div class="control split-control">
					<input :value="currentAddress" readonly />
					<button class="btn btn-success btn-inline" v-if="walletType === 'ledger'" :disabled="!connected" @click="onVerifyLedger">{{ translate('verify') }}</button>
				</div>
				<div class="address-counter">{{ translate('address') }} {{ currentIndex }}</div>
			</div>
		</transition>
	</modal>
</template>

<script>
import Modal from './Modal';
import AddressQrCode from '@/components/AddressQRCode';
import ConnectLedger from '@/components/ledger/ConnectLedger';
import { getFirstWalletAddresses } from '@/store/db';
import { formatNumber } from '@/utils/format';

export default {
	components: {
		AddressQrCode,
		ConnectLedger,
		Modal
	},
	async beforeMount() {
		try {
			const addresses = await getFirstWalletAddresses(this.wallet.id);

			addresses.sort((a, b) => {
				if (a.index > b.index)
					return 1;

				if (a.index < b.index)
					return -1;

				return 0;
			});

			this.addresses = addresses.slice(0, 100);
			setTimeout(() => {
				this.loaded = true;
			}, 300);
		} catch (ex) {
			console.error('receiveModalBeforeMount', ex);
			this.pushNotification({
				severity: 'danger',
				message: ex.message
			});
		}
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			connected: false,
			loaded: false,
			ledgerDevice: null,
			current: 0,
			addresses: []
		};
	},
	beforeDestroy() {
		// Close the ledger device when we're done
		if (this.ledgerDevice)
			this.ledgerDevice.close();
	},
	computed: {
		walletType() {
			return this.wallet && typeof this.wallet.type === 'string' ? this.wallet.type : 'watch';
		},
		currentAddress() {
			if (!Array.isArray(this.addresses) || this.addresses.length <= this.current || !this.addresses[this.current])
				return '';

			return this.addresses[this.current].address;
		},
		currentIndex() {
			if (!Array.isArray(this.addresses) || this.addresses.length <= this.current || !this.addresses[this.current])
				return '0';

			return formatNumber(this.addresses[this.current].index, 0);
		}
	},
	methods: {
		async onVerifyLedger() {
			try {
				if (!this.ledgerDevice)
					throw new Error('No ledger device');

				const { address } = await this.ledgerDevice.verifyStandardAddress(this.current);
				if (this.currentAddress !== address)
					throw new Error('Address does not match device');
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					icon: ['fab', 'usb'],
					message: ex.message
				});
				console.error('ReceiveSiacoinModal.onVerifyLedger', ex);
			}
		},
		onChangeAddress(n) {
			try {
				let v = this.current + n;

				if (v < 0)
					v = this.addresses.length - 1;

				if (v >= this.addresses.length)
					v = 0;

				this.current = v;
			} catch (ex) {
				console.error('onChangeAddress', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onConnected(device) {
			try {
				this.ledgerVersion = await device.getVersion();
				this.ledgerDevice = device;
				this.connected = true;
			} catch (ex) {
				device.close();
				console.error('onConnected', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.qr-display {
	width: 100%;
	padding: 10px;
	margin: auto;
    background: dark-gray;
    border-radius: 4px;

	@media screen and (min-width: 500px) {
		width: 200px;
		height: 200px;
	}

	svg {
		margin: auto;
		padding: 0;
	}
}

.address-counter, .ledger-verify {
	grid-column: 1 / -1;
}

.ledger-verify {
	.btn.btn-inline {
		margin: 15px 0 0;
	}
}

.address-counter {
	text-align: center;
	color: rgba(255, 255, 255, 0.54);
	font-size: 0.8rem;
}

.split-control {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	grid-gap: 15px;
}

.receive-grid {
	display: grid;
	height: 100%;
	grid-gap: 15px;
	align-items: safe center;
	align-content: safe center;
	grid-template-columns: auto minmax(0, 1fr) auto;

	.control {
		grid-column: 1 / -1;
		margin-bottom: 0;
	}
}

.btn-prev, .btn-next {
	display: inline-block;
	background: transparent;
	font-size: 2rem;
	color: rgba(255, 255, 255, 0.54);
	border: none;
	outline: none;

	&:hover, &:active, &:focus {
		color: primary;
		cursor: pointer;
	}
}

.btn-prev {
	text-align: left;
}

.btn-next {
	text-align: right;
}
</style>