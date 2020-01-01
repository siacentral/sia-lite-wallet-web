<template>
	<modal @close="$emit('close')">
		<transition name="fade-top" mode="out-in" appear>
			<div class="receive-grid" v-show="loaded" key="receive">
				<button class="btn-prev" @click="onChangeAddress(-1)"><icon icon="chevron-left" /></button>
				<address-qr-code class="qr-display" :address="addresses[current] || ''" />
				<button class="btn-next" @click="onChangeAddress(1)"><icon icon="chevron-right" /></button>
				<div class="control">
					<input :value="addresses[current]" readonly />
				</div>
			</div>
		</transition>
	</modal>
</template>

<script>
import Modal from './Modal';
import AddressQrCode from '@/components/AddressQRCode';
import { getLastWalletAddresses } from '@/store/db';

export default {
	components: {
		AddressQrCode,
		Modal
	},
	async beforeMount() {
		try {
			const addresses = await this.loadWalletAddresses(0);

			this.addresses = addresses.map(a => a.address);

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
			loaded: false,
			current: 0,
			addresses: []
		};
	},
	methods: {
		loadWalletAddresses(page) {
			if (!this.wallet || !this.wallet.id)
				return;

			const limit = 100;

			return getLastWalletAddresses(this.wallet.id, limit, limit * page);
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

.receive-grid {
	display: grid;
	height: 100%;
	grid-gap: 15px;
	align-items: safe center;
	align-content: safe center;
	grid-template-columns: auto minmax(0, 1fr) auto;

	.control {
		grid-column: 1 / -1;
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