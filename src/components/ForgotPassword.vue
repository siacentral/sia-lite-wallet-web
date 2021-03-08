<template>
	<div class="page page-forgot">
		<div class="page-content">
			<h1 class="text-center text-error">{{ translate('resetWalletModal.heading') }}</h1>
			<p>{{ translate('resetWalletModal.pExplain') }}</p>
			<div class="confirm">
				<div class="control">
					<input type="checkbox" id="chk-reset-confirm" v-model="confirmed" />
					<label class="text-error" for="chk-reset-confirm"> {{ translate('resetWalletModal.chkConfirm') }}</label>
				</div>
			</div>
			<div class="buttons">
				<button class="btn btn-inline" @click="$emit('close')">{{ translate('cancel') }}</button>
				<button class="btn btn-danger btn-inline" @click="onReset" :disabled="!confirmed">{{ translate('resetWalletModal.btnDelete') }}</button>
			</div>
		</div>
	</div>
</template>

<script>
import { reset } from '@/store/db.js';
import { mapActions } from 'vuex';

export default {
	data() {
		return {
			confirmed: false
		};
	},
	methods: {
		...mapActions(['setSetup']),
		async onReset() {
			try {
				if (!this.confirmed)
					return;

				await reset();
				this.setSetup(false);
				this.$emit('close');
			} catch (ex) {
				console.error('unable to reset', ex);
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.page-forgot {
	position: fixed;
	background: bg-dark;
	z-index: 99;
}

.page-content {
	display: grid;
	height: 100%;
	max-width: 700px;
	margin: auto;
	padding: 15px;
	grid-gap: 15px;
	align-content: safe center;
	overflow-x: hidden;
	overflow-y: auto;
}
</style>