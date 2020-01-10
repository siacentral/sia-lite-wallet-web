<template>
	<div class="transaction-outputs">
		<table>
			<tr class="header" v-if="inputs && inputs.length !== 0"><td colspan="5">{{ translate('inputs') }}</td></tr>
			<output-list v-if="inputs && inputs.length !== 0" :outputs="inputs" />
			<tr class="header" v-if="outputs && outputs.length !== 0"><td colspan="5">{{ translate('outputs') }}</td></tr>
			<output-list v-if="outputs && outputs.length !== 0" :outputs="outputs" />
		</table>
	</div>
</template>

<script>
import { mapState } from 'vuex';

import OutputList from '@/components/transactions/OutputList';

export default {
	components: {
		OutputList
	},
	props: {
		transaction: Object
	},
	computed: {
		...mapState(['currency', 'currencies', 'feeAddresses']),
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_outputs))
				return [];

			return this.transaction.siacoin_outputs.map(o => ({
				...o,
				tag: this.getOutputTag(o)
			}));
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoin_inputs))
				return [];

			return this.transaction.siacoin_inputs.map(i => ({
				...i,
				tag: this.getInputTag(i)
			}));
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

<style lang="stylus">
.transaction-outputs.transaction-outputs {
	padding: 7px;
	background: bg-dark;
	overflow: hidden;

	table tbody tr {
		background: bg-dark;
	}

	tr.header {
		td {
			text-align: left;
			color: rgba(255, 255, 255, 0.54);
			z-index: 5;
		}
	}
}
</style>