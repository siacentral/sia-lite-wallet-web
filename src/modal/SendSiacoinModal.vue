<template>
	<modal @close="$emit('close')">
		<transition name="fade-top" mode="out-in" appear>
			<transaction-setup class="transaction-step" :wallet="wallet" :address="address" v-if="step === 'setup'" key="setup" @built="onTransactionBuilt" />
			<transaction-verify class="transaction-step" :wallet="wallet" :data="data" v-else-if="step === 'verify'" key="verify" @done="$emit('close')" />
		</transition>
	</modal>
</template>

<script>
import Modal from './Modal';
import TransactionSetup from '@/components/transaction/TransactionSetup';
import TransactionVerify from '@/components/transaction/TransactionVerify';

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
			data: null,
			sigIndexes: []
		};
	},
	mounted() {
		setTimeout(() => {
			this.step = 'setup';
		}, 300);
	},
	methods: {
		onTransactionBuilt(data) {
			try {
				this.data = data;
				this.step = 'verify';
			} catch (ex) {
				console.error('onTransactionBuilt', ex);
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