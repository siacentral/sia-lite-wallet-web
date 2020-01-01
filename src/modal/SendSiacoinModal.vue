<template>
	<modal @close="$emit('close')">
		<transition name="fade-top" mode="out-in" appear>
			<transaction-setup class="transaction-step" :wallet="wallet" :address="address" v-if="step === 'setup'" key="setup" @built="onTransactionBuilt" />
			<transaction-verify class="transaction-step" :wallet="wallet" :transaction="transaction" v-else-if="step === 'verify'" key="verify" @done="$emit('close')" />
		</transition>
	</modal>
</template>

<script>
import Modal from './Modal';
import TransactionSetup from '@/components/transactions/send/TransactionSetup';
import TransactionVerify from '@/components/transactions/send/TransactionVerify';

export default {
	components: {
		Modal,
		TransactionSetup,
		TransactionVerify
	},
	props: {
		address: String,
		wallet: Object
	},
	data() {
		return {
			step: '',
			transaction: null,
			sigIndexes: []
		};
	},
	mounted() {
		setTimeout(() => {
			this.step = 'setup';
		}, 300);
	},
	methods: {
		onTransactionBuilt(txn) {
			try {
				this.transaction = txn;
				this.step = 'verify';
			} catch (ex) {
				console.error('onTransactionBuilt', ex);
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
.transaction-step {
	display: grid;
	height: 100%;
	align-content: safe center;
}
</style>