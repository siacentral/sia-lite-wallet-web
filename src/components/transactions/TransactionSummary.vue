<template>
	<div class="transaction-summary">
		<div class="transaction-outputs">
			<table>
				<siacoin-output-list v-if="direction === 'send'" :outputs="recipients" />
				<siacoin-output-list v-else :outputs="received" />
			</table>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';

import SiacoinOutputList from '@/components/transactions/SiacoinOutputList';

export default {
	components: {
		SiacoinOutputList
	},
	props: {
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'feeAddresses']),
		direction() {
			return this.input.gt(this.output) ? 'send' : 'receive';
		},
		value() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return new BigNumber(0);

			return this.transaction.siacoin_outputs.reduce((total, o) => {
				if (!o.owned)
					return total;

				return total.plus(o.value);
			}, new BigNumber(0));
		},
		input() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return new BigNumber(0);

			return this.transaction.siacoin_inputs.reduce((total, o) => {
				if (!o.owned)
					return total;

				return total.plus(o.value);
			}, new BigNumber(0));
		},
		output() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return new BigNumber(0);

			return this.transaction.siacoin_outputs.reduce((total, o) => {
				if (!o.owned)
					return total;

				return total.plus(o.value);
			}, new BigNumber(0));
		},
		recipients() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs.reduce((outputs, o) => {
				if (o.owned || this.feeAddresses.indexOf(o.unlock_hash) !== -1)
					return outputs;

				const i = outputs.findIndex(a => a.unlock_hash === o.unlock_hash);

				if (i !== -1)
					outputs[i].value = outputs[i].value.plus(o.value);
				else {
					outputs.push({
						...o,
						tag: this.getOutputTag(o)
					});
				}

				return outputs;
			}, []);
		},
		received() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs.reduce((outputs, o) => {
				if (!o.owned)
					return outputs;

				const i = outputs.findIndex(a => a.unlock_hash === o.unlock_hash);

				if (i !== -1)
					outputs[i].value = outputs[i].value.plus(o.value);
				else {
					outputs.push({
						...o,
						tag: this.getOutputTag(o)
					});
				}

				return outputs;
			}, []);
		}
	},
	methods: {
		getOutputTag(output) {
			if (output.owned)
				return this.translate('outputTags.received');

			if (this.feeAddresses.indexOf(output.unlock_hash) !== -1)
				return this.translate('outputTags.apiFee');

			return this.translate('outputTags.recipient');
		},
		getInputTag(output) {
			if (output.owned)
				return this.translate('outputTags.sent');

			if (this.feeAddresses.indexOf(output.unlock_hash) !== -1)
				return this.translate('outputTags.apiFee');

			return this.translate('outputTags.sender');
		}
	}
};
</script>

<style lang="stylus" scoped>
.transaction-outputs.transaction-outputs {
	padding: 7px;
	background: bg-dark;
	overflow: hidden;

	table tbody tr {
		background: bg-dark;
	}
}
</style>