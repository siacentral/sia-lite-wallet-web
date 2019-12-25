<template>
	<div>
		<h2 class="text-center">Verify Transaction</h2>
		<div class="recipients">
			<template class="recipient" v-for="recipient in recipients" >
				<identicon :value="recipient.unlockhash" :key="`identicon-${recipient.unlockhash}`" />
				<input class="recipient-address" :key="`address-${recipient.unlockhash}`" :value="recipient.unlockhash" readonly />
				<div class="text-right" v-html="getRecipientSC(recipient)" :key="`sc-${recipient.unlockhash}`" />
				<div class="text-right" v-html="getRecipientCurrency(recipient)" :key="`usd-${recipient.unlockhash}`" />
			</template>
		</div>
		<div class="extras-info">
			<div class="divider" />
			<div>Send Amount</div>
			<div class="text-right" v-html="sendAmountSC" />
			<div class="text-right" v-html="sendAmountCurrency" />
			<div>Transaction Fee</div>
			<div class="text-right" v-html="transactionFeeSC" />
			<div class="text-right" v-html="transactionFeeCurrency" />
			<div class="divider" />
			<div>Total Amount</div>
			<div class="text-right" v-html="totalAmountSC" />
			<div class="text-right" v-html="totalAmountCurrency" />
			<div>Remaining Balance</div>
			<div class="text-right" v-html="remainingBalanceSC" />
			<div class="text-right" v-html="remainingBalanceCurrency" />
			<div class="divider" />
		</div>
		<div class="transaction-error text-center text-warning">
			<transition name="fade" mode="out-in" appear>
				<div v-if="transactionError" :key="transactionError">{{ transactionError }}</div>
				<div v-else class="error-hidden">hidden</div>
			</transition>
		</div>
		<div class="buttons">
			<transition name="fade" mode="out-in" appear>
				<div v-if="sending" :key="status">{{ status }}</div>
				<button class="btn btn-success btn-inline" v-else :disabled="transactionError || sending" @click="onVerifyTxn" key="send">Send</button>
			</transition>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState, mapActions } from 'vuex';
import { formatCurrencyString, formatSiacoinString } from '@/utils/format';
import { signTransaction } from '@/utils/sia';
import { scanTransactions } from '@/sync/scanner';
import { broadcastTransaction } from '@/api/siacentral';

import Identicon from '@/components/Identicon';

export default {
	components: {
		Identicon
	},
	props: {
		wallet: Object,
		data: Object
	},
	computed: {
		...mapState(['currency', 'currencies', 'networkFees']),
		spentOutputs() {
			if (!this.data || !this.data.transaction)
				return [];

			return this.data.transaction.siacoininputs.map(a => a.parentid);
		},
		walletBalance() {
			if (!this.data || !this.data.transaction)
				return new BigNumber(0);

			return this.wallet.unconfirmedBalance().minus(this.sendAmount).plus(this.receiveAmount);
		},
		recipients() {
			if (!this.data || !this.data.transaction)
				return [];

			return this.data.transaction.siacoinoutputs.filter(o =>
				o.unlockhash !== this.data.apiFeeAddress && o.unlockhash !== this.data.changeAddress);
		},
		receiveAmount() {
			return this.data.newOwnedOutputs.reduce((v, o) => v.plus(o.value), new BigNumber(0));
		},
		sendAmount() {
			if (!this.data || !this.data.transaction)
				return new BigNumber(0);

			return this.data.transaction.siacoinoutputs
				.reduce((v, o) => v.plus(o.value), new BigNumber(0)).minus(this.apiFee);
		},
		requiredSignatures() {
			if (!this.data || !Array.isArray(this.data.sigIndexes))
				return 0;

			return this.data.sigIndexes.length;
		},
		apiFee() {
			if (!this.data || !this.data.transaction)
				return new BigNumber(0);

			return this.data.transaction.siacoinoutputs
				.reduce((v, o) => o.unlockhash === this.data.apiFeeAddress ? v.plus(o.value) : v, new BigNumber(0));
		},
		siaFee() {
			if (!this.data || !this.data.transaction)
				return new BigNumber(0);

			return this.data.transaction.minerfees.reduce((v, o) => v.plus(o), new BigNumber(0));
		},
		fees() {
			return this.apiFee.plus(this.siaFee);
		},
		transactionFeeSC() {
			const siacoins = formatSiacoinString(this.fees);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		transactionFeeCurrency() {
			const currency = formatCurrencyString(this.fees, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		sendAmountSC() {
			const rem = this.sendAmount.minus(this.receiveAmount),
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		sendAmountCurrency() {
			const rem = this.sendAmount.minus(this.receiveAmount),
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		totalAmountSC() {
			const rem = this.sendAmount.minus(this.receiveAmount).plus(this.fees),
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		totalAmountCurrency() {
			const rem = this.sendAmount.minus(this.receiveAmount).plus(this.fees),
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		remainingBalanceSC() {
			const rem = this.walletBalance,
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		remainingBalanceCurrency() {
			const rem = this.walletBalance,
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	},
	data() {
		return {
			sending: false,
			transactionError: null,
			status: null
		};
	},
	methods: {
		...mapActions(['saveWallet']),
		async onVerifyTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				let signed;

				this.status = 'Signing transaction...';

				switch (this.wallet.type) {
				case 'default':
					signed = await signTransaction(this.wallet.seed, this.data.transaction, this.data.requiredSigs);
					break;
				default:
					throw new Error('unsupported wallet type');
				}

				this.status = 'Broadcasting transaction...';

				await broadcastTransaction(signed);
				await scanTransactions(this.wallet);

				this.status = 'Transaction sent...';
				this.$emit('done');
			} catch (ex) {
				console.error('onVerifyTxn', ex);
				this.status = ex.message;
			} finally {
				this.sending = false;
			}
		},
		getRecipientSC(recipient) {
			const siacoins = formatSiacoinString(new BigNumber(recipient.value));

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		getRecipientCurrency(recipient) {
			const currency = formatCurrencyString(new BigNumber(recipient.value), this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		}
	}
};
</script>

<style lang="stylus" scoped>
h2 {
	color: rgba(255, 255, 255, 0.54);
	margin: 0 0 45px;
}

.recipients {
	display: grid;
	grid-template-columns: 64px minmax(0, 1fr) repeat(2, auto);
	grid-gap: 15px;
	align-items: safe center;
	margin-bottom: 15px;

	.recipient-address {
		display: block;
		width: 100%;
		background: none;
		color: rgba(255, 255, 255, 0.54);
		font-size: 1.2rem;
		outline: none;
		border: none;
		text-overflow: ellipsis;
	}
}

.extras-info {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	grid-gap: 10px;
	margin-bottom: 15px;

	.divider {
		width: 100%;
		height: 1px;
		grid-column: 1 / -1;
		background: dark-gray;
		margin: 5px 0;
	}
}

.transaction-error {
	margin-bottom: 15px;

	.error-hidden {
		opacity: 0;
	}
}

.identifier {
	width: 100px;
	margin: auto auto 30px;

	svg {
		width: 100%;
		height: 100%;
		border-radius: 4px;
	}
}

.buttons {
	text-align: center;
}
</style>