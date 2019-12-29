<template>
	<div class="wallet-display">
		<div class="wallet-balance">
			<div class="wallet-title">{{ name }}</div>
			<div class="wallet-siacoin-balance" v-html="formatSiacoinString(balance)"></div>
			<div class="wallet-display-balance" v-html="formatCurrencyString(balance)"></div>
			<div class="wallet-buttons">
				<button class="btn wallet-btn" @click="modal='send'" v-if="wallet.type !== 'watch'">Send</button>
				<button class="btn wallet-btn" @click="modal='receive'">Receive</button>
			</div>
		</div>
		<div class="wallet-transactions">
			<table class="transactions-grid">
				<tbody>
					<template v-for="group in transactions">
						<tr class="group-date" :key="group.date"><td colspan="4">{{ group.date }}</td></tr>
						<tr v-for="(transaction, i) in group.transactions" :key="`${group.date}-${i}`" :class="getTransactionClasses(transaction)">
							<td class="transaction-type fit-text">{{ friendlyType(transaction) }}</td>
							<td class="transaction-spacer"></td>
							<td class="transaction-confirms fit-text"><span>{{ friendlyConfirms(transaction.confirmations) }}</span></td>
							<td class="transaction-amount fit-text">
								<div v-html="getTransactionSiacoins(transaction)"/>
								<div class="transaction-currency" v-html="getTransactionCurrency(transaction)" />
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
		<transition name="fade" mode="out-in" appear>
			<send-siacoin-modal v-if="modal === 'send'" :wallet="wallet" @close="modal = null" />
			<receive-siacoin-modal v-if="modal === 'receive'" :wallet="wallet" @close="modal = null" />
		</transition>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import BigNumber from 'bignumber.js';
import { formatSiacoinString, formatCurrencyString } from '@/utils/format';

import SendSiacoinModal from '@/modal/SendSiacoinModal';
import ReceiveSiacoinModal from '@/modal/ReceiveSiacoinModal';

export default {
	components: {
		ReceiveSiacoinModal,
		SendSiacoinModal
	},
	props: {
		wallet: Object
	},
	data() {
		return {
			modal: null
		};
	},
	computed: {
		...mapState(['currency', 'currencies']),
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
		}
	},
	methods: {
		getTransactionClasses(transaction) {
			const classes = {};

			classes[`transaction-${transaction.direction}`] = true;

			if (transaction.confirmations <= 0)
				classes['transaction-unconfirmed'] = true;

			return classes;
		},
		formatSiacoinString(val) {
			const format = formatSiacoinString(val, 2);

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		formatCurrencyString(val) {
			const format = formatCurrencyString(val, this.currency, this.currencies[this.currency]);

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

			const format = formatSiacoinString(value);

			if (txn.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		},
		getTransactionCurrency(txn) {
			let value = new BigNumber(txn.value);

			if (value.isNaN() || !value.isFinite())
				value = new BigNumber(0);

			const format = formatCurrencyString(value, this.currency, this.currencies[this.currency]);

			if (txn.direction === 'sent')
				return `-${format.value} <span class="currency-display">${format.label}</span>`;

			return `${format.value} <span class="currency-display">${format.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
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

.wallet-title {
	font-size: 1.3rem;
	text-align: center;
	margin-bottom: 15px;
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

.wallet-buttons {
	display: grid;
    grid-template-columns: repeat(2, minmax(auto, 1fr));
    max-width: 700px;
    margin: auto;
    grid-gap: 30px;
    padding: 15px;
    align-items: center;
    justify-items: center;
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