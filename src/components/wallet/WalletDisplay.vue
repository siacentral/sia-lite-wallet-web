<template>
	<div class="wallet-display">
		<div class="wallet-balance">
			<div class="wallet-title">{{ name }} <button class="btn-select" @click="modal = 'wallet'"><icon icon="chevron-down" /></button>
				<transition name="fade" mode="out-in">
					<div class="wallet-scanning" v-if="wallet.scanning === 'full'" key="scanning">
						<icon icon="redo" /> {{ translate('walletStatus.scanning') }}
					</div>
					<div class="wallet-scanning" v-else-if="walletQueued" key="queued">
						<icon icon="redo" /> {{ translate('walletStatus.queued') }}
					</div>
				</transition>
			</div>
			<div class="wallet-siacoin-balance" v-html="formatSiacoinString(siacoinBalance)"></div>
			<div class="wallet-display-balance" v-html="formatCurrencyString(siacoinBalance)"></div>
			<div class="wallet-display-balance" v-if="siafundBalance.gt(0)" v-html="formatSiafundString(siafundBalance)"></div>
			<div class="wallet-button-wrapper">
				<div class="wallet-buttons">
					<button class="btn wallet-btn" @click="modal='send'" v-if="wallet.type !== 'watch'">{{ translate('send') }}</button>
					<button class="btn wallet-btn" @click="modal='receive'">{{ translate('receive') }}</button>
					<div class="wallet-more-btn">
						<button class="more-btn" @click="showMore = !showMore"><icon icon="ellipsis-v" /></button>
						<transition name="fade-top" mode="out-in">
							<div class="dropdown" v-if="showMore">
								<button class="dropdown-item" @click="onBuySiacoin" v-if="wallet.currency !== 'scp'">
									<icon icon="credit-card" />{{ translate('buySiacoin') }}</button>
								<button class="dropdown-item" @click="onQueueWallet"
									:disabled="walletQueued">
									<icon icon="redo" />{{ translate('rescanWallet') }}</button>
								<button class="dropdown-item"
									v-if="wallet.server_type === 'walrus' || wallet.type === 'watch' || wallet.type === 'ledger'"
									@click="onDropdownModal('add')">
									<icon icon="plus" />{{ translate('addAddresses') }}</button>
								<button class="dropdown-item" v-if="wallet.type !== 'watch' && wallet.type !== 'ledger' && outputsLen > 90"
									@click="onDefragWallet"
									:disabled="walletQueued">
									<icon icon="sitemap" />{{ translate('defragWallet') }}</button>
								<button class="dropdown-item" @click="onDropdownModal('exportTransactions')" v-if="wallet.server_type === 'siacentral'">
									<icon icon="file-export" />{{ translate('exportTransactions') }}</button>
								<button class="dropdown-item" @click="onDropdownModal('export')" v-if="wallet.type === 'default'">
									<icon icon="file-export" />{{ translate('exportSeed') }}</button>
								<button class="dropdown-item" @click="onDropdownModal('delete')">
									<icon icon="trash" />{{ translate('deleteWallet') }}</button>
							</div>
						</transition>
					</div>
				</div>
			</div>
		</div>
		<div class="wallet-transactions">
			<table class="transactions-grid">
				<tbody>
					<template v-for="group in transactions">
						<tr class="group-date" :key="group.date"><td colspan="4">{{ group.date }}</td></tr>
						<transaction-list-item v-for="(transaction, i) in group.transactions"
							:key="`${group.date}-${i}`"
							:transaction="transaction"
							:wallet="wallet"
							@click="onSelectTransaction(transaction.transaction_id)" />
					</template>
				</tbody>
			</table>
		</div>
		<transition name="fade" mode="out-in" appear>
			<add-addresses-modal v-if="modal === 'add'" :wallet="wallet" @close="modal = null" />
			<confirm-modal v-else-if="modal === 'delete'"
				:title="deleteTitle"
				:buttons="deleteButtons"
				@close="modal = null" @selected="onDeleteWallet">
				<p>{{ translate('deleteWalletModal.pDeleteConfirm', name) }}</p>
			</confirm-modal>
			<defrag-siacoin-modal v-else-if="modal === 'defrag'" :wallet="wallet" @close="modal = null" />
			<send-siacoin-modal v-else-if="modal === 'send'" :wallet="wallet" @close="modal = null" />
			<receive-siacoin-modal v-else-if="modal === 'receive'" :wallet="wallet" @close="modal = null" />
			<transaction-detail-modal v-else-if="modal === 'transaction'" :transaction="walletTransactions[selectedTransaction]" :wallet="wallet" @close="modal = null" />
			<export-seed-modal v-else-if="modal === 'export'" :wallet="wallet" @close="modal = null" />
			<export-transactions-modal v-else-if="modal === 'exportTransactions'" :wallet="wallet" @close="modal = null" />
			<select-wallet-modal
				v-else-if="modal === 'wallet'"
				:wallets="wallets"
				:active="active"
				@selected="(i) => $emit('selected', i)"
				@close="modal = null" />
		</transition>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import BigNumber from 'bignumber.js';
import Transak from '@transak/transak-sdk';
import { getLastWalletAddresses } from '@/store/db';
import { formatPriceString, formatSiafundString } from '@/utils/format';

import AddAddressesModal from '@/modal/AddAddressesModal';
import ConfirmModal from '@/modal/ConfirmModal';
import DefragSiacoinModal from '@/modal/DefragSiacoinModal';
import ExportSeedModal from '@/modal/ExportSeedModal';
import ExportTransactionsModal from '@/modal/ExportTransactionsModal';
import ReceiveSiacoinModal from '@/modal/ReceiveSiacoinModal';
import SendSiacoinModal from '@/modal/SendSiacoinModal';
import SelectWalletModal from '@/modal/SelectWalletModal';
import TransactionDetailModal from '@/modal/TransactionDetailModal';
import TransactionListItem from '@/components/transactions/TransactionListItem';

export default {
	components: {
		AddAddressesModal,
		ConfirmModal,
		DefragSiacoinModal,
		ExportSeedModal,
		ExportTransactionsModal,
		ReceiveSiacoinModal,
		SendSiacoinModal,
		SelectWalletModal,
		TransactionDetailModal,
		TransactionListItem
	},
	props: {
		wallet: Object,
		wallets: Array,
		active: String
	},
	data() {
		return {
			modal: null,
			selectedTransaction: 0,
			showMore: false
		};
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP', 'scanQueue']),
		walletQueued() {
			return this.wallet.scanning === 'full' || this.scanQueue.filter(s => s.walletID === this.wallet.id && s.full).length !== 0;
		},
		siacoinBalance() {
			if (!this.wallet)
				return new BigNumber(0);

			return this.wallet.unconfirmedSiacoinBalance();
		},
		siafundBalance() {
			if (!this.wallet)
				return new BigNumber(0);

			return this.wallet.unconfirmedSiafundBalance();
		},
		outputsLen() {
			const outputs = this.wallet && Array.isArray(this.wallet.unspent_siacoin_outputs) ? this.wallet.unspent_siacoin_outputs : [],
				spent = this.wallet && Array.isArray(this.wallet.spent_siacoin_outputs) ? this.wallet.spent_siacoin_outputs : [],
				filtered = outputs.filter(o => spent.indexOf(o.output_id) === -1);

			return filtered.length;
		},
		name() {
			if (!this.wallet || !this.wallet.title || this.wallet.title.length === 0)
				return 'Wallet';

			return this.wallet.title;
		},
		walletTransactions() {
			const transactions = this.wallet ? this.wallet.transactions : null;

			if (!Array.isArray(transactions))
				return [];

			return transactions.reduce((v, t) => {
				v[t.transaction_id] = t;

				return v;
			}, {});
		},
		transactions() {
			const transactions = this.wallet ? this.wallet.transactions : null,
				groupedTxns = [];

			if (!Array.isArray(transactions))
				return [];

			const days = transactions.reduce((m, t) => {
				const d = new Date(t.timestamp).toLocaleDateString([], {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				});

				if (!m[d])
					m[d] = [];

				m[d].push({
					...t,
					timestamp: new Date(t.timestamp)
				});

				return m;
			}, {});

			for (const date in days) {
				groupedTxns.push({
					date: date,
					transactions: days[date]
				});
			}

			groupedTxns.sort((a, b) => {
				const ad = new Date(a.date),
					bd = new Date(b.date);

				if (ad > bd)
					return -1;

				if (ad < bd)
					return 1;

				return 0;
			});

			return groupedTxns;
		},
		deleteButtons() {
			return [
				{
					key: 'delete',
					type: 'danger'
				},
				{
					key: 'cancel'
				}
			];
		},
		deleteTitle() {
			return this.translate('deleteWalletModal.deleteHeader', this.name);
		}
	},
	methods: {
		...mapActions(['deleteWallet']),
		onSelectTransaction(id) {
			try {
				if (!this.walletTransactions[id] || this.wallet.server_type === 'walrus')
					return;

				this.selectedTransaction = id;
				this.modal = 'transaction';
			} catch (ex) {
				console.error(ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onQueueWallet() {
			try {
				this.queueWallet(this.wallet.id, true);

				this.pushNotification({
					icon: 'redo',
					message: this.translate('alerts.rescanWallet')
				});
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					icon: 'redo',
					message: ex.message
				});
				console.error('onQueueWallet', ex);
			} finally {
				this.showMore = false;
			}
		},
		onDefragWallet() {
			try {
				this.modal = 'defrag';
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					icon: 'redo',
					message: ex.message
				});
				console.error('onQueueWallet', ex);
			}
		},
		onDropdownModal(modal) {
			try {
				this.modal = modal;
			} catch (ex) {
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
				console.error('onDropdownModal', ex);
			} finally {
				this.showMore = false;
			}
		},
		async onBuySiacoin() {
			this.showMore = false;

			try {
				const addresses = await getLastWalletAddresses(this.wallet.id, 1, 0);

				if (!Array.isArray(addresses) || addresses.length === 0)
					throw new Error('unable to buy siacoin no known addresses');

				const transak = new Transak({
					apiKey: process.env.VUE_APP_TRANSAK_KEY,
					environment: 'PRODUCTION',
					cryptoCurrencyCode: 'SC',
					walletAddress: addresses[0].address,
					themeColor: '19cf86',
					countryCode: 'US',
					widgetHeight: `${window.innerHeight * 0.8}px`,
					hostURL: window.location.origin
				});

				transak.init();

				// To get all the events
				transak.on(transak.ALL_EVENTS, (data) => {
					console.log(data);
				});

				// This will trigger when the user marks payment is made.
				transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
					console.log(orderData);
					transak.close();
				});
			} catch (ex) {
				console.error('WalletDisplay.onBuySiacoin', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onDeleteWallet(button) {
			try {
				this.modal = null;

				if (button !== 'delete')
					return;

				await this.deleteWallet(this.wallet.id);
				this.$emit('deleted');
			} catch (ex) {
				console.error('onDeleteWallet', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'trash',
					message: ex.message
				});
			}
		},
		formatSiacoinString(val) {
			const format = formatPriceString(val, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		formatSiafundString(val) {
			const format = formatSiafundString(val, this.wallet.currency);

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		},
		formatCurrencyString(val) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const format = formatPriceString(val, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${format.value} <span class="currency-display">${this.translate(`currency.${format.label}`)}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
.wallet-title {
	position: relative;
	font-size: 1.3rem;
	text-align: center;
	margin-bottom: 30px;
	padding: 0 25px;

	.wallet-scanning {
		position: absolute;
		bottom: -25px;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.2);

		svg {
			margin-right: 5px;
		}
	}
}

.wallet-display {
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	grid-gap: 15px;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.btn-select {
	position: absolute;
	display: inline-block;
	right: 0;
	top: 3px;
	outline: none;
	border: none;
	background: transparent;
	color: rgba(255, 255, 255, 0.54);

	@media screen and (min-width: 767px) {
		display: none;
	}
}

.wallet-balance {
	padding: 15px;
}

.wallet-btn {
	padding: 12px;
}

.wallet-more-btn {
	position: relative;
	display: inline-block;

	.more-btn {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.54);
		background: transparent;
		border: none;
		outline: none;
		cursor: pointer;
	}

	.dropdown {
		display: inline-block;
		position: absolute;
		top: calc(100% + 20px);
		right: 0;
		background: bg-dark-accent;
		border-radius: 4px;
		border-top-right-radius: 0;
		z-index: 99;
		box-shadow: global-shadow;

		&:before {
			position: absolute;
			top: -8px;
			right: 3px;
			content: '';
			width: 16px;
			height: 16px;
			background: #25272a;
			-webkit-transform: rotateZ(45deg);
			transform: rotateZ(45deg);
			z-index: 98;
		}

		.dropdown-item {
			padding: 15px;
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.54);
			white-space: nowrap;
			border: none;
			background: transparent;
			outline: none;
			cursor: pointer;

			svg {
				margin-right: 15px;
			}

			&:disabled {
				opacity: 0.28;
			}

			&:hover, &:active, &:focus {
				color: primary;
			}
		}
	}
}

.wallet-siacoin-balance {
	color: primary;
	font-size: 2.5rem;
	text-align: center;
}

.wallet-display-balance {
	color: rgba(255, 255, 255, 0.54);
	font-size: 1.8rem;
	text-align: center;
	margin-bottom: 15px;
}

.wallet-button-wrapper {
	margin: auto;
	max-width: 500px;
}

.wallet-buttons {
	display: flex;
    align-items: center;
    justify-items: center;

	.wallet-btn {
		flex: 1;
		margin-right: 15px;

		&:last-child {
			margin-right: 0;
		}
	}
}

.wallet-transactions {
	height: 100%;
	border-top: 1px solid bg-dark-accent;
	overflow-x: hidden;
	overflow-y: auto;

	.transactions-grid {
		padding: 15px;

		.group-date td {
			position: sticky;
			top: 0;
			padding: 15px;
			color: primary;
			background: bg-dark;
			text-align: left;
			z-index: 5;
		}

		.transaction-received {
			color: primary;
		}

		.transaction-confirms span {
			display: none;
			padding: 2px 4px;
			background: dark-gray;
			border-radius: 4px;
			color: rgba(255, 255, 255, 0.54);
			text-align: center;
		}

		.transaction-unconfirmed {
			opacity: 0.45;

			.transaction-confirms span {
				display: inline-block;
			}
		}

		tr {
			color: rgba(255, 255, 255, 0.54);
			background: bg-dark;

			td {
				border-bottom: 1px solid bg-dark-accent;
				padding: 15px;
			}

			&:hover, &:focus, &:active {
				background: bg-dark-accent;
				cursor: pointer;
			}
		}

		.transaction-amount, .transaction-currency, .transaction-type {
			text-align: right;
		}

		.transaction-amount {
			font-size: 1.3rem;
		}

		.transaction-currency {
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.54);
		}

		.transaction-spacer {
			width: 100%;
		}

		.transaction-type {
			text-align: left;
		}

		.group-date {
			width: 100%;
			grid-column: 1 / -1;
			color: rgba(255, 255, 255, 0.54);
			font-size: 1.1rem;
		}
	}
}
</style>