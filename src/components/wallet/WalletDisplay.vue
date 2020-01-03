<template>
	<div class="wallet-display">
		<div class="wallet-balance">
			<div class="wallet-title">{{ name }}
				<transition name="fade" mode="out-in">
					<div class="wallet-scanning" v-if="wallet.scanning === 'full'" key="scanning">
						<icon icon="redo" /> Scanning...
					</div>
					<div class="wallet-scanning" v-else-if="walletQueued" key="queued">
						<icon icon="redo" /> Scan Queued...
					</div>
				</transition>
			</div>
			<div class="wallet-siacoin-balance" v-html="formatSiacoinString(balance)"></div>
			<div class="wallet-display-balance" v-html="formatCurrencyString(balance)"></div>
			<div class="wallet-button-wrapper">
				<div class="wallet-buttons">
					<button class="btn wallet-btn" @click="modal='send'" v-if="wallet.type !== 'watch'">Send</button>
					<button class="btn wallet-btn" @click="modal='receive'">Receive</button>
					<div class="wallet-more-btn">
						<button class="more-btn" @click="showMore = !showMore"><icon icon="ellipsis-v" /></button>
						<transition name="fade-top" mode="out-in">
							<div class="dropdown" v-if="showMore">
								<button class="dropdown-item" @click="onQueueWallet"
									:disabled="walletQueued">
									<icon icon="redo" />Rescan Wallet</button>
								<button class="dropdown-item"
									v-if="wallet.type === 'watch' || wallet.type === 'ledger'"
									@click="onDropdownModal('add')">
									<icon icon="plus" />Add Addresses</button>
								<button class="dropdown-item" @click="onExportSeed" v-if="wallet.type === 'default'">
									<icon icon="file-export" />Export Seed</button>
								<button class="dropdown-item" @click="onDropdownModal('delete')">
									<icon icon="trash" />Delete Wallet</button>
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
						<tr v-for="(transaction, i) in group.transactions" :key="`${group.date}-${i}`" :class="getTransactionClasses(transaction)">
							<td class="transaction-type fit-text">{{ friendlyType(transaction) }}</td>
							<td class="transaction-spacer" />
							<td class="transaction-confirms fit-text"><span>{{ friendlyConfirms(transaction.confirmations) }}</span></td>
							<td class="transaction-amount fit-text">
								<div v-html="transaction.siacoins"/>
								<div class="transaction-currency" v-html="transaction.currency" />
							</td>
						</tr>
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
				<p>Are you sure you want to delete the wallet named "{{ name }}"? This will remove all data
					associated with this wallet from your device. Please make sure you have the
					recovery seed backed up.</p>
			</confirm-modal>
			<send-siacoin-modal v-else-if="modal === 'send'" :wallet="wallet" @close="modal = null" />
			<receive-siacoin-modal v-else-if="modal === 'receive'" :wallet="wallet" @close="modal = null" />
		</transition>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatPriceString } from '@/utils/format';

import AddAddressesModal from '@/modal/AddAddressesModal';
import ConfirmModal from '@/modal/ConfirmModal';
import SendSiacoinModal from '@/modal/SendSiacoinModal';
import ReceiveSiacoinModal from '@/modal/ReceiveSiacoinModal';

export default {
	components: {
		AddAddressesModal,
		ConfirmModal,
		ReceiveSiacoinModal,
		SendSiacoinModal
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			modal: null,
			showMore: false
		};
	},
	computed: {
		...mapState(['currency', 'currencies', 'scanQueue']),
		walletQueued() {
			return this.wallet.scanning === 'full' || this.scanQueue.filter(s => s.walletID === this.wallet.id && s.full).length !== 0;
		},
		balance() {
			if (!this.wallet)
				return new BigNumber(0);

			return this.wallet.unconfirmedBalance();
		},
		name() {
			if (!this.wallet || !this.wallet.title || this.wallet.title.length === 0)
				return 'Wallet';

			return this.wallet.title;
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
					siacoins: this.getTransactionSiacoins(t),
					currency: this.getTransactionCurrency(t),
					timestamp: new Date(t.timestamp)
				});

				return m;
			}, {});

			for (let date in days) {
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
					text: 'Delete',
					type: 'danger'
				},
				{
					text: 'Cancel'
				}
			];
		},
		deleteTitle() {
			return `Delete "${this.name}"?`;
		}
	},
	methods: {
		...mapActions(['deleteWallet']),
		onQueueWallet() {
			try {
				this.queueWallet(this.wallet.id, true);

				this.pushNotification({
					icon: 'redo',
					message: 'Wallet has been queued for rescan'
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
		onExportSeed() {
			try {
				const link = document.createElement('a');

				link.style.display = 'none';

				link.setAttribute('href',
					`data:text/plan;charset=utf-8,${encodeURIComponent(this.wallet.seed)}`);
				link.setAttribute('download', `${this.name.toLowerCase()}.siaseed`);
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} catch (ex) {
				console.error('onExportSeed', ex);
				this.pushNotification({
					severity: 'danger',
					icon: 'file-export',
					message: ex.message
				});
			} finally {
				this.showMore = false;
			}
		},
		async onDeleteWallet(button) {
			try {
				this.modal = null;

				if (button !== 'Delete')
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
		getTransactionClasses(transaction) {
			const classes = {};

			classes[`transaction-${transaction.direction}`] = true;

			if (transaction.confirmations <= 0)
				classes['transaction-unconfirmed'] = true;

			return classes;
		},
		formatSiacoinString(val) {
			const format = formatPriceString(val, 2);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		formatCurrencyString(val) {
			const format = formatPriceString(val, 2, this.currency, this.currencies[this.currency]);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		friendlyType(txn) {
			if (!txn || !Array.isArray(txn.tags))
				return 'Siacoin Transaction';

			switch (txn.tags[0]) {
			case 'contract_revision':
				return 'Contract Revision';
			case 'contract_formation':
				return 'Contract Formation';
			case 'storage_proof':
				return 'Storage Proof';
			case 'host_announcements':
				return 'Host Announcement';
			case 'contract_valid_output':
			case 'contract_missed_output':
				return 'Contract Completion';
			case 'block_reward':
				return 'Block Reward';
			case 'siafund_claim':
				return 'Siafund Claim';
			case 'defrag':
				return 'Defrag';
			default:
				return txn.tags[0];
			}
		},
		friendlyConfirms(confirmations) {
			if (isNaN(confirmations) || !isFinite(confirmations))
				return 'Unconfirmed';

			return confirmations <= 0 ? 'Unconfirmed' : '';
		},
		getTransactionSiacoins(txn) {
			let value = new BigNumber(txn.value);

			if (value.isNaN() || !value.isFinite())
				value = new BigNumber(0);

			const format = formatPriceString(value, 2);

			if (txn.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		getTransactionCurrency(txn) {
			let value = new BigNumber(txn.value);

			if (value.isNaN() || !value.isFinite())
				value = new BigNumber(0);

			const format = formatPriceString(value, 2, this.currency, this.currencies[this.currency]);

			if (txn.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
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
		z-index: 999;
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
			z-index: 998;
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
	max-width: 700px;
}

.wallet-buttons {
	display: flex;
    padding: 15px;
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