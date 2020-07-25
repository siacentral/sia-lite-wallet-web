<template>
	<modal @close="$emit('close')">
		<p class="text-warning">{{ translate('defragModal.defragExplain') }}</p>
		<transition name="fade-top" mode="out-in">
			<defrag-setup :wallet="wallet" v-if="step === 'setup'" key="setup" @built="onTransactionsBuilt" />
			<div v-else-if="step === 'sending'" :key="status">{{ status }}</div>
		</transition>
	</modal>
</template>

<script>
import Modal from './Modal';
import DefragSetup from '@/components/transactions/DefragSetup';
import { signTransactions } from '@/utils/sia';
import { scanTransactions } from '@/sync/scanner';
import { siaAPI, scprimeAPI } from '@/api/siacentral';
import WalrusClient from '@/api/walrus';

export default {
	components: {
		Modal,
		DefragSetup
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			step: 'setup',
			status: '',
			sending: false,
			transactions: []
		};
	},
	methods: {
		async onTransactionsBuilt(txns) {
			if (this.sending)
				return;

			try {
				this.sending = true;
				this.step = 'sending';

				this.status = this.translate('sendSiacoinsModal.statusSigning');

				const unsigned = txns.transactions.map(txn => ({
					transaction: {
						minerfees: txn.miner_fees,
						siacoininputs: txn.siacoin_inputs.map(i => ({
							parentid: i.output_id,
							unlockconditions: i.unlock_conditions
						})),
						siacoinoutputs: txn.siacoin_outputs.map(o => ({
							unlockhash: o.unlock_hash,
							value: o.value
						})),
						transactionsignatures: txn.siacoin_inputs.map(i => ({
							parentid: i.output_id,
							coveredfields: { wholetransaction: true }
						}))
					},
					requiredSignatures: txn.siacoin_inputs.map(i => i.index)
				}));
				let signed = [];

				switch (this.wallet.type) {
				case 'ledger':
					throw new Error('Ledger does not support defragmenting');
				case 'default':
					signed = await signTransactions(this.wallet.seed, this.wallet.currency, unsigned);
					break;
				default:
					throw new Error('unsupported wallet type');
				}

				this.status = this.translate('sendSiacoinsModal.statusBroadcasting');

				await this.broadcastTxnset(signed);
				await scanTransactions(this.wallet);

				this.$emit('close');
			} catch (ex) {
				console.error('onTransactionBuilt', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.sending = false;
			}
		},
		broadcastTxnset(txnset) {
			switch (this.wallet.server_type) {
			case 'walrus':
				return new WalrusClient(this.wallet.server_url).broadcastTransaction(txnset.map(txn => ({
					siacoinInputs: txn.siacoininputs,
					siacoinOutputs: txn.siacoinoutputs,
					minerFees: txn.minerfees,
					transactionSignatures: txn.transactionsignatures
				})));
			default:
				switch (this.wallet.currency) {
				case 'scp':
					return scprimeAPI.broadcastTransaction(txnset);
				default:
					return siaAPI.broadcastTransaction(txnset);
				}
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
</style>