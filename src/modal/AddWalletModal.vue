<template>
	<div class="page-modal">
		<button href="#" class="close-btn" @click="$emit('close')"><icon icon="times" /></button>
		<transition name="fade-top" mode="out-in" appear>
			<div class="modal-content wallet-mode" v-if="step === 'pickMode'" key="pickMode">
				<div class="create-wallet-button" @click="onCreateWallet">
					<div class="button-icon"><icon icon="plus" /></div>
					<div class="button-title">New Wallet</div>
					<p>Generates a new wallet seed in the browser. Transactions can be sent and received.</p>
				</div>
				<div class="create-wallet-button" @click="step = 'recover'">
					<div class="button-icon"><icon icon="redo" /></div>
					<div class="button-title">Recover Wallet</div>
					<p>Recovers an existing wallet from a 29 word seed. Transactions can be sent and received.</p>
				</div>
				<div :class="hardwareBtnClasses" @click="step = 'hardware'">
					<div class="button-icon"><icon :icon="['fab', 'usb']" /></div>
					<div class="button-title">Ledger Wallet</div>
					<p v-if="ledgerSupported">Creates a new hardware backed wallet. All transactions must be signed by the Ledger device.</p>
					<p v-else>Ledger support is only available in the Chrome browser. Enable "Experimental Web Platform Features" in Chrome to connect to the Ledger device.</p>
				</div>
				<div class="create-wallet-button" @click="step = 'watch'">
					<div class="button-icon"><icon icon="eye" /></div>
					<div class="button-title">Watch-Only Wallet</div>
					<p>Creates a new watch-only wallet. Addresses must be added manually and transactions cannot be sent.</p>
				</div>
			</div>
			<div class="modal-content" v-if="step === 'recover'" key="recover">
				<div class="control">
					<input type="text" v-model="recoverySeed" />
				</div>
				<div class="controls">
					<button class="btn btn-primary" @click="onRecoverWallet">Recover</button>
				</div>
			</div>
			<div class="modal-content" v-if="step === 'recoverStatus'" key="recoverStatus">

			</div>
			<div class="modal-content" v-else-if="step === 'review'" key="review">

			</div>
		</transition>
	</div>
</template>

<script>
import { generateSeed, generateAddresses } from '@/utils/sia';
import { queueWallet } from '@/sync/scanner';
import { saveAddresses } from '@/store/db';
import ledger from '@/utils/ledger';
import { mapState, mapActions } from 'vuex';

export default {
	computed: {
		...mapState(['password']),
		hardwareBtnClasses() {
			return {
				'create-wallet-button': true,
				'create-button-disabled': !this.ledgerSupported
			};
		},
		ledgerSupported() {
			return ledger.isSupported();
		}
	},
	data() {
		return {
			step: '',
			recoverySeed: ''
		};
	},
	mounted() {
		setTimeout(() => {
			this.step = 'pickMode';
		}, 300);
	},
	methods: {
		...mapActions(['saveWallet']),
		async onCreateWallet() {
			try {
				const seed = await generateSeed(),
					addresses = await generateAddresses(seed, 0, 100),
					id = await this.saveWallet({
						seed,
						type: 'default'
					}, this.password);

				await saveAddresses(addresses.map(a => ({
					...a,
					wallet_id: id
				})));

				queueWallet({
					id,
					seed
				},
				true);
			} catch (ex) {
				console.error('onCreateWallet', ex);
			}
		},
		async onRecoverWallet() {
			try {
				const id = await this.saveWallet({
					seed: this.recoverySeed,
					type: 'default'
				}, this.password);

				queueWallet({
					id,
					seed: this.recoverySeed
				},
				true);
			} catch (ex) {
				console.error(ex);
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.page-modal {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 60px 15px;
	background: bg-dark-accent;
	overflow-x: hidden;
	overflow-y: auto;
	z-index: 999;
}

.close-btn {
	display: inline-block;
	position: absolute;
	top: 10px;
	right: 10px;
	font-size: 2rem;
	color: rgba(255, 255, 255, 0.54);
	background: transparent;
	border: none;
	outline: none;
	box-shadow: none;
	transition: all 0.3s linear;

	&:hover, &:active {
		color: primary;
		cursor: pointer;
	}
}

.modal-content {
	max-width: 600px;
	margin: auto;

	@media screen and (min-width: 767px) {
		height: 100%;
	}
}

.modal-content.wallet-mode {
	display: grid;
	min-height: max-content;
	width: 100%;
	grid-template-rows: auto;
	grid-gap: 20px;
	align-content: center;
	justify-content: center;

	@media screen and (min-width: 767px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.create-wallet-button {
	width: 100%;
	padding: 15px;
	border: 1px solid dark-gray;
	border-radius: 4px;
	box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.14);
	transition: all 0.3s linear;

	&.create-button-disabled {
		opacity: 0.54;

		&:focus, &:active, &:hover {
			color: rgba(255, 255, 255, 0.54);
			border-color: dark-gray;
			cursor: pointer;
			box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.28);
		}
	}

	.button-icon {
		font-size: 2.4rem;
		text-align: center;
		margin-bottom: 15px;
	}

	.button-title {
		font-size: 1.2rem;
		text-align: center;
		margin-bottom: 15px;
	}

	p {
		color: rgba(255, 255, 255, 0.54);
		margin: 0;
	}

	&:focus, &:active, &:hover {
		color: primary;
		border-color: primary;
		cursor: pointer;
		box-shadow: 0 1px 2px 1px rgba(0, 0, 0, 0.28);
	}
}
</style>