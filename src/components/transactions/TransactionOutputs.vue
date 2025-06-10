<template>
	<div class="transaction-outputs">
		<table>
			<tr class="header" v-if="inputs && inputs.length !== 0"><td colspan="5">{{ translate('inputs') }}</td></tr>
			<siacoin-output-list v-if="inputs && inputs.length !== 0" :wallet="wallet" :outputs="inputs" />
			<tr class="header" v-if="outputs && outputs.length !== 0"><td colspan="5">{{ translate('outputs') }}</td></tr>
			<siacoin-output-list v-if="outputs && outputs.length !== 0" :wallet="wallet" :outputs="outputs" />
			<tr class="header" v-if="sfInputs && sfInputs.length !== 0"><td colspan="5">Siafund Inputs</td></tr>
			<siafund-output-list v-if="sfInputs && sfInputs.length !== 0" :wallet="wallet" :outputs="sfInputs" />
			<tr class="header" v-if="sfOutputs && sfOutputs.length !== 0"><td colspan="5">Siafund Outputs</td></tr>
			<siafund-output-list v-if="sfOutputs && sfOutputs.length !== 0" :wallet="wallet" :outputs="sfOutputs" />
		</table>
	</div>
</template>

<script>
import { mapState } from 'vuex';

import SiacoinOutputList from '@/components/transactions/SiacoinOutputList';
import SiafundOutputList from '@/components/transactions/SiafundOutputList';

export default {
	components: {
		SiacoinOutputList,
		SiafundOutputList
	},
	props: {
		transaction: Object,
		wallet: Object
	},
	computed: {
		...mapState(['feeAddresses']),
		outputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoinOutputs))
				return [];

			return this.transaction.siacoinOutputs.map(o => ({
				...o,
				tag: this.getOutputTag(o)
			}));
		},
		inputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siacoinInputs))
				return [];

			return this.transaction.siacoinInputs.map(i => ({
				...i,
				tag: this.getInputTag(i)
			}));
		},
		sfOutputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siafundOutputs))
				return [];

			return this.transaction.siafundOutputs.map(o => ({
				...o,
				tag: this.getOutputTag(o)
			}));
		},
		sfInputs() {
			if (!this.transaction || !Array.isArray(this.transaction.siafundInputs))
				return [];

			return this.transaction.siafundInputs.map(i => ({
				...i,
				tag: this.getInputTag(i)
			}));
		}
	},
	methods: {
		getOutputTag(output) {
			if (output.owned)
				return this.translate('outputTags.received');

			return this.translate('outputTags.recipient');
		},
		getInputTag(output) {
			if (output.owned)
				return this.translate('outputTags.sent');

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