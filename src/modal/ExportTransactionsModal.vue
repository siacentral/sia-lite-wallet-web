<template>
	<modal @close="$emit('close')">
		<label>Transaction Dates</label>
		<div class="control">
			<select v-model="exportRange" @change="onSelectRange">
				<option value="all">{{ translate('exportTransactionsModal.dateRangeAll') }}</option>
				<option value="year">{{ translate('exportTransactionsModal.dateRangeYear') }}</option>
				<option value="lastYear">{{ translate('exportTransactionsModal.dateRangeLastYear') }}</option>
				<option value="month">{{ translate('exportTransactionsModal.dateRangeMonth') }}</option>
				<option value="lastMonth">{{ translate('exportTransactionsModal.dateRangeLastMonth') }}</option>
				<option value="custom">{{ translate('exportTransactionsModal.dateRangeCustom') }}</option>
			</select>
		</div>
		<template v-if="exportRange === 'custom'">
			<label>{{ translate('exportTransactionsModal.labelMin') }}</label>
			<div class="control">
				<input type="date" v-model="rangeMinStr" @change="onChangeMin" />
			</div>
			<label>{{ translate('exportTransactionsModal.labelMax') }}</label>
			<div class="control">
				<input type="date" v-model="rangeMaxStr" @change="onChangeMax" />
			</div>
		</template>
		<div class="error-message text-error">
			{{ validMessage }}
		</div>
		<transition name="fade" mode="out-in">
			<div class="buttons" v-if="!exporting">
				<button class="btn btn-inline btn-success" @click="onExportTransactions" :disabled="exporting || !valid">{{ translate('export') }}</button>
			</div>
			<div class="text-center" v-else>{{ exportMessage }}</div>
		</transition>
	</modal>
</template>

<script>
import { getWalletAddresses } from '@/store/db';
import { exportTransactions } from '@/utils/sia';
import { formatNumber } from '@/utils/format';

import Modal from './Modal';

export default {
	components: {
		Modal
	},
	props: {
		wallet: Object
	},
	computed: {
		name() {
			if (!this.wallet || !this.wallet.title || this.wallet.title.length === 0)
				return 'Wallet';

			return this.wallet.title;
		},
		valid() {
			if (this.min == null || this.max == null)
				return false;

			if (this.min > this.max)
				return false;

			return true;
		},
		validMessage() {
			if (this.min > this.max)
				return this.translate('exportTransactionsModal.errMaxGtMin');

			return '';
		},
		exportMessage() {
			return this.translate('exportTransactionsModal.exportMessage',
				formatNumber(this.matching), formatNumber(this.total), formatNumber(this.addresses));
		}
	},
	data() {
		return {
			min: 0,
			max: 0,
			rangeMinStr: '',
			rangeMaxStr: '',
			exportRange: 'all',
			exporting: false,
			matching: 0,
			total: 0,
			addresses: 0
		};
	},
	methods: {
		formatNumber,
		onChangeMin() {
			try {
				const date = new Date(this.rangeMinStr);

				date.setHours(0, 0, 0, 0);

				this.min = date.getTime() / 1000;
			} catch (ex) {
				console.error('ExportTransactionsModal.onChangeMin', ex);
			}
		},
		onChangeMax() {
			try {
				const date = new Date(this.rangeMaxStr);

				date.setHours(23, 59, 59, 0);

				this.max = date.getTime() / 1000;
			} catch (ex) {
				console.error('ExportTransactionsModal.onChangeMax', ex);
			}
		},
		onSelectRange() {
			try {
				const current = new Date();

				switch (this.exportRange) {
				case 'year':
					this.min = new Date(current.getFullYear(), 0, 1, 0, 0, 0, 0).getTime() / 1000;
					this.max = new Date(current.getFullYear(), 11, 31, 23, 59, 59, 0).getTime() / 1000;
					break;
				case 'lastYear':
					this.min = new Date(current.getFullYear() - 1, 0, 1, 0, 0, 0, 0).getTime() / 1000;
					this.max = new Date(current.getFullYear() - 1, 11, 31, 23, 59, 59, 0).getTime() / 1000;
					break;
				case 'month':
					this.min = new Date(current.getFullYear(), current.getMonth(), 1, 0, 0, 0, 0).getTime() / 1000;
					this.max = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 0).getTime() / 1000;
					break;
				case 'lastMonth':
					this.min = new Date(current.getFullYear(), current.getMonth() - 1, 1, 0, 0, 0, 0).getTime() / 1000;
					this.max = new Date(current.getFullYear(), current.getMonth(), 0, 23, 59, 59, 0).getTime() / 1000;
					break;
				case 'custom ':
					break;
				default:
					this.min = 0;
					this.max = 0;
					break;
				}
			} catch (ex) {
				console.error('ExportTransactionsModal.onSelectRange', ex);
			}
		},
		onExportProgress({ matching, transactions, addresses }) {
			this.matching = matching;
			this.total = transactions;
			this.addresses = addresses;
		},
		async onExportTransactions() {
			if (this.exporting)
				return;

			this.exporting = true;

			try {
				const addresses = await getWalletAddresses(this.wallet.id);

				if (!Array.isArray(addresses) || addresses.length === 0)
					throw new Error('wallet has no addresses');

				const buf = await exportTransactions(addresses.map(a => a.address), this.wallet.currency, this.min, this.max, this.onExportProgress);

				this.downloadFile(buf);
				this.$emit('close');
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					icon: 'redo',
					message: ex.message
				});
				console.error('onExportTransactions', ex);
			} finally {
				this.exporting = false;
			}
		},
		downloadFile(buf) {
			const link = document.createElement('a'),
				data = new Blob([buf]),
				objURL = URL.createObjectURL(data);

			link.style.display = 'none';

			link.setAttribute('href', objURL);
			link.setAttribute('download', `${this.name.toLowerCase()} transactions.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
};
</script>

<style lang="stylus" scoped>

</style>