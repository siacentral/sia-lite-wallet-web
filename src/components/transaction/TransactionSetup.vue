<template>
	<div>
		<div class="identifier">
			<identicon :value="recipientAddress" />
		</div>
		<div class="control">
			<label>Recipient Address</label>
			<input type="text" v-model="recipientAddress" placeholder="Send Siacoin to..." />
		</div>
		<label>Amount</label>
		<div class="currency-control">
			<input ref="txtSiacoin" type="text" value="0 SC" @input="onChangeSiacoin" @blur="onFormatValues" />
			<label>SC</label>
			<input ref="txtCurrency" type="text" value="$0.00" @input="onChangeCurrency" @blur="onFormatValues" />
			<label>{{ currency }}</label>
		</div>
		<div class="extras-info">
			<div>Transaction Fee</div>
			<div class="text-right" v-html="transactionFeeSC" />
			<div class="text-right" v-html="transactionFeeCurrency" />
			<div>Spendable Balance</div>
			<div class="text-right" v-html="remainingBalanceSC" />
			<div class="text-right" v-html="remainingBalanceCurrency" />
		</div>
		<div class="transaction-error text-center text-warning">
			<transition name="fade" mode="out-in" appear>
				<div v-if="transactionError" :key="transactionError">{{ transactionError }}</div>
				<div v-else class="error-hidden">hidden</div>
			</transition>
		</div>
		<div class="buttons">
			<button class="btn btn-success btn-inline" :disabled="transactionError || sending" @click="onSendTxn">Send</button>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { verifyAddress } from '@/utils';
import { parseCurrencyString, parseSiacoinString } from '@/utils/parse';
import { formatCurrencyString, formatSiacoinString } from '@/utils/format';
import { getAddresses, getWalletUnlockHashes, getWalletChangeAddress } from '@/store/db';

import Identicon from '@/components/Identicon';

export default {
	components: {
		Identicon
	},
	props: {
		address: String,
		wallet: Object
	},
	computed: {
		...mapState(['currency', 'currencies', 'networkFees']),
		walletBalance() {
			return this.unspent.reduce((v, o) => v.plus(o.value), new BigNumber(0));
		},
		unspent() {
			const outputs = this.wallet && Array.isArray(this.wallet.outputs) ? this.wallet.outputs : [],
				spent = this.wallet && Array.isArray(this.wallet.spent) ? this.wallet.spent : [],
				unspent = outputs.filter(o => spent.indexOf(o) === -1);

			if (!Array.isArray(unspent) || unspent.length === 0)
				return [];

			unspent.sort((a, b) => {
				a = new BigNumber(a);
				b = new BigNumber(b);

				if (a.gt(b))
					return 1;

				if (a.lt(b))
					return -1;

				return 0;
			});

			return unspent;
		},
		transactionFeeSC() {
			const siacoins = formatSiacoinString(this.fees);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		transactionFeeCurrency() {
			const currency = formatCurrencyString(this.fees, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		calculatedAmount() {
			let amount = this.sendAmount;

			if (this.ownedAddresses.indexOf(this.recipientAddress) !== -1)
				amount = new BigNumber(0);

			return amount;
		},
		remainingBalanceSC() {
			const rem = this.walletBalance.minus(this.calculatedAmount).minus(this.fees),
				siacoins = formatSiacoinString(rem);

			return `${siacoins.value} <span class="currency-display">${siacoins.label}</span>`;
		},
		remainingBalanceCurrency() {
			const rem = this.walletBalance.minus(this.calculatedAmount).minus(this.fees),
				currency = formatCurrencyString(rem, this.currency, this.currencies[this.currency]);

			return `${currency.value} <span class="currency-display">${currency.label}</span>`;
		},
		transactionError() {
			if (this.sendAmount.lte(0))
				return 'Must send more than 0 SC';

			if (this.sendAmount.plus(this.fees).gt(this.walletBalance))
				return 'Send amount more than balance';

			if (this.sendAmount.lt(this.fees))
				return 'Amount sent is less than transaction fees';

			if (!verifyAddress(this.recipientAddress))
				return 'Invalid recipient address';

			return null;
		},
		minInputs() {
			return this.fundInputs(this.sendAmount).length + 3;
		},
		apiFee() {
			return new BigNumber(this.networkFees.api.fee).times(this.minInputs * 300);
		},
		siaFee() {
			return new BigNumber(this.networkFees.minimum).plus(this.networkFees.maximum).div(2).times(this.minInputs * 300);
		},
		fees() {
			return this.apiFee.plus(this.siaFee);
		}
	},
	data() {
		return {
			recipientAddress: '',
			sendAmount: new BigNumber(0),
			sending: false,
			ownedAddresses: []
		};
	},
	mounted() {
		try {
			this.onFormatValues();
			this.loadAddresses();
		} catch (ex) {
			console.error('TransactionSetupMounted', ex);
		}
	},
	methods: {
		async loadAddresses() {
			this.ownedAddresses = await getWalletUnlockHashes(this.wallet.id);
		},
		fundInputs(amount) {
			const inputs = [];
			let added = new BigNumber(0),
				i = 0;

			for (; i < this.unspent.length; i++) {
				if (added.gte(this.sendAmount))
					break;

				added = added.plus(this.unspent[i].value);
				inputs.push(this.unspent[i]);
			}

			return inputs;
		},
		async buildTransaction() {
			let added = new BigNumber(0),
				changeAddress;

			const outputs = this.fundInputs(this.sendAmount.plus(this.fees)),
				addresses = await getAddresses(this.wallet.id, outputs.map(o => o.unlock_hash)),
				feeAddress = this.networkFees.api.address,
				sigIndexes = [],
				inputs = outputs.map(o => {
					const addr = addresses.find(a => o.unlock_hash === a.address);

					added = added.plus(o.value);

					if (sigIndexes.indexOf(addr.index) === -1)
						sigIndexes.push(addr.index);

					return {
						parentid: o.output_id,
						unlockconditions: addr.unlock_conditions
					};
				}),
				change = added.minus(this.fees).minus(this.sendAmount),
				txn = {
					minerfees: [this.siaFee.toString(10)],
					siacoininputs: inputs,
					siacoinoutputs: [
						{
							unlockhash: this.recipientAddress,
							value: this.sendAmount.toString(10)
						},
						{
							unlockhash: feeAddress,
							value: this.apiFee.toString(10)
						}
					]
				};

			if (change.gt(0)) {
				const addr = await getWalletChangeAddress(this.wallet.id);

				if (!addr)
					throw new Error('unable to send transaction. no change address');

				changeAddress = addr.address;

				if (!changeAddress || !verifyAddress(changeAddress) || this.ownedAddresses.indexOf(changeAddress) === -1)
					throw new Error('unable to send transaction. no change address');

				txn.siacoinoutputs.push({
					unlockhash: changeAddress,
					value: change.toString(10)
				});
			}

			return {
				transaction: txn,
				requiredSigs: sigIndexes,
				apiFeeAddress: feeAddress,
				changeAddress: changeAddress,
				newOwnedOutputs: txn.siacoinoutputs
					.filter(o => this.ownedAddresses.indexOf(o.unlockhash) !== -1)
			};
		},
		formatCurrencyString(value) {
			return formatCurrencyString(value, this.currency, this.currencies[this.currency]).value;
		},
		async onSendTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				const built = await this.buildTransaction();

				this.$emit('built', built);
			} catch (ex) {
				console.error(ex);
			} finally {
				this.sending = false;
			}
		},
		onFormatValues() {
			try {
				const siacoins = formatSiacoinString(this.sendAmount);

				this.$refs.txtCurrency.value = this.formatCurrencyString(this.sendAmount);
				this.$refs.txtSiacoin.value = siacoins.value;
			} catch (ex) {
				console.error(ex);
			}
		},
		onChangeSiacoin() {
			try {
				const value = this.$refs.txtSiacoin.value,
					parsed = parseSiacoinString(value);

				this.sendAmount = parsed;
				this.$refs.txtCurrency.value = this.formatCurrencyString(parsed);
			} catch (ex) {
				console.error(ex);
			}
		},
		onChangeCurrency() {
			try {
				const value = this.$refs.txtCurrency.value,
					parsed = parseCurrencyString(value, this.currencies[this.currency]),
					siacoins = formatSiacoinString(parsed);

				this.sendAmount = parsed;
				this.$refs.txtSiacoin.value = siacoins.value;
			} catch (ex) {
				console.error(ex);
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
.currency-control {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	margin-bottom: 15px;

	input, label {
		height: 36px;
		line-height: 36px;
		padding: 0 5px;
	}

	label {
		display: inline-block;
		color: rgba(255, 255, 255, 0.54);
		text-transform: uppercase;
		margin: 0;
	}

	input {
		display: block;
		width: 100%;
		font-size: 1.2rem;
		background: transparent;
		border: 1px solid dark-gray;
		color: rgba(255, 255, 255, 0.84);
		outline: none;
		text-align: right;

		&:first-of-type {
			border-top-left-radius: 4px;
			border-top-right-radius: 4px;
		}

		&:last-of-type {
			border-bottom-left-radius: 4px;
			border-bottom-right-radius: 4px;
			border-top: none;
		}
	}
}

.extras-info {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(2, auto);
	grid-gap: 10px;
	margin-bottom: 15px;
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