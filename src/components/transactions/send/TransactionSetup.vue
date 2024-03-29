<template>
	<div>
		<div class="identifier">
			<identicon :value="recipientAddress" />
		</div>
		<div class="control">
			<label>{{ translate('sendSiacoinsModal.recipientAddress') }}</label>
			<input type="text" v-model="recipientAddress" :placeholder="translate('sendSiacoinsModal.txtRecipientPlaceholder')" />
		</div>
		<label>{{ translate('amount') }}</label>
		<div class="currency-control">
			<input ref="txtSiacoin" type="text" value="0 SC" @input="onChangeSiacoin" @blur="onFormatValues" />
			<label>{{ baseCurrencyLabel }}</label>
			<input ref="txtCurrency" type="text" value="$0.00" @input="onChangeCurrency" @blur="onFormatValues" />
			<label>{{ translate(`currency.${currency}`) }}</label>
			<div class="transaction-buttons">
				<button class="btn btn-small btn-inline" @click="onSendHalf">{{ translate('half') }}</button>
				<button class="btn btn-small btn-inline" @click="onSendFull">{{ translate('full') }}</button>
			</div>
		</div>
		<div class="extras-info">
			<div>{{ translate('transactionFee') }}</div>
			<div class="text-right" v-html="transactionFeeSC" />
			<div class="text-right" v-html="transactionFeeCurrency" />
			<div>{{ translate('sendSiacoinsModal.remainingBalance') }}</div>
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
			<button class="btn btn-success btn-inline" :disabled="transactionError || sending" @click="onSendTxn">{{ translate('send') }}</button>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { calculateFee, verifyAddress } from '@/utils';
import { parseCurrencyString, parseSiacoinString } from '@/utils/parse';
import { formatPriceString } from '@/utils/format';
import { getWalletAddresses } from '@/store/db';

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
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP', 'siaNetworkFees', 'scprimeNetworkFees']),
		baseCurrencyLabel() {
			if (this.wallet && this.wallet.currency === 'scp')
				return this.translate('currency.scp');

			return this.translate('currency.sc');
		},
		networkFees() {
			if (this.wallet && this.wallet.currency === 'scp')
				return this.scprimeNetworkFees;

			return this.siaNetworkFees;
		},
		walletBalance() {
			return this.wallet.unconfirmedSiacoinBalance();
		},
		changeAddress() {
			let addr = this.ownedAddresses.find(a => a.usage_type !== 'sent');

			if (!addr)
				addr = this.ownedAddresses[this.ownedAddresses.length - 1];

			return addr;
		},
		unspent() {
			const outputs = this.wallet && Array.isArray(this.wallet.unspent_siacoin_outputs) ? this.wallet.unspent_siacoin_outputs : [],
				spent = this.wallet && Array.isArray(this.wallet.spent_siacoin_outputs) ? this.wallet.spent_siacoin_outputs : [],
				unspent = outputs.filter(o => spent.indexOf(o.output_id) === -1);

			if (!Array.isArray(unspent) || unspent.length === 0)
				return [];

			unspent.sort((a, b) => {
				a = new BigNumber(a.value);
				b = new BigNumber(b.value);

				if (a.gt(b))
					return -1;

				if (a.lt(b))
					return 1;

				return 0;
			});

			return unspent;
		},
		fees() {
			return this.siaFee.plus(this.apiFee);
		},
		transactionFeeSC() {
			const siacoins = formatPriceString(this.fees, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${siacoins.label}`)}</span>`;
		},
		transactionFeeCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(this.fees, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		calculatedAmount() {
			let amount = this.sendAmount;

			if (this.ownedAddresses.indexOf(this.recipientAddress) !== -1)
				amount = new BigNumber(0);

			return amount;
		},
		remainingBalanceSC() {
			const rem = this.walletBalance.minus(this.calculatedAmount).minus(this.fees),
				siacoins = formatPriceString(rem, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${siacoins.label}`)}</span>`;
		},
		remainingBalanceCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const rem = this.walletBalance.minus(this.calculatedAmount).minus(this.fees),
				currency = formatPriceString(rem, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		transactionError() {
			if (this.sendAmount.lte(0))
				return this.translate('sendSiacoinsModal.errorGreaterThan0');

			if (this.sendAmount.plus(this.fees).gt(this.walletBalance))
				return this.translate('sendSiacoinsModal.errorNotEnough');

			if (this.sendAmount.lt(this.fees))
				return this.translate('sendSiacoinsModal.errorHighFee');

			if (!verifyAddress(this.recipientAddress))
				return this.translate('sendSiacoinsModal.errorBadRecipient');

			if (this.inputs.length >= 95)
				return this.translate('sendSiacoinsModal.errorTooManyInputs');

			return null;
		}
	},
	data() {
		return {
			recipientAddress: '',
			inputs: [],
			sendAmount: new BigNumber(0),
			siaFee: new BigNumber(0),
			apiFee: new BigNumber(0),
			sending: false,
			ownedAddresses: []
		};
	},
	async mounted() {
		try {
			if (typeof this.address === 'string' && this.address.length > 0)
				this.recipientAddress = this.address;

			this.onFormatValues();
			await this.loadAddresses();
		} catch (ex) {
			console.error('TransactionSetupMounted', ex);
			this.pushNotification({
				severity: 'danger',
				message: ex.message
			});
		}
	},
	methods: {
		async loadAddresses() {
			this.ownedAddresses = await getWalletAddresses(this.wallet.id);

			if (this.ownedAddresses.length === 0)
				throw new Error('no addresses');
		},
		ownsAddress(address) {
			return this.ownedAddresses.findIndex(a => a.address === address && a.unlock_conditions) !== -1;
		},
		calcTxnFees(inputs) {
			const sia = calculateFee(inputs, 3, new BigNumber(this.networkFees.minimum)),
				serverType = this.wallet?.server_type,
				walletType = this.wallet?.type,
				authed = !!(process.env?.VUE_APP_SIACENTRAL_TOKEN?.length > 0);
			let api = new BigNumber(0);

			if (serverType === 'siacentral' && (walletType !== 'ledger' || !authed))
				api = calculateFee(inputs, 3, new BigNumber(this.networkFees.api.fee));

			return { sia, api, total: sia.plus(api) };
		},
		addInputs(amount) {
			const inputs = [];
			let added = new BigNumber(0);

			for (let i = 0; i < this.unspent.length; i++) {
				const output = this.unspent[i],
					addr = this.ownedAddresses.find(a => output.unlock_hash === a.address && a.unlock_conditions);

				if (!addr)
					continue;

				added = added.plus(output.value);
				inputs.push({
					...output,
					...addr,
					owned: true
				});

				if (added.gte(amount))
					break;
			}

			if (inputs.length <= 5 && this.unspent.length >= 30) {
				for (let i = 1; i <= 10; i++) {
					const output = this.unspent[this.unspent.length - i],
						addr = this.ownedAddresses.find(a => output.unlock_hash === a.address && a.unlock_conditions);

					if (!addr)
						continue;

					added = added.plus(output.value);
					inputs.push({
						...output,
						...addr,
						owned: true
					});
				}
			}

			return inputs;
		},
		fundTransactionWithFees(amount) {
			const minInputs = this.addInputs(amount),
				{ sia, api } = this.calcTxnFees(minInputs.length);

			this.inputs = this.addInputs(amount.plus(sia).plus(api));
			this.siaFee = sia;
			this.apiFee = api;
		},
		buildTransaction() {
			const added = this.inputs.reduce((v, i) => v.plus(i.value), new BigNumber(0)),
				txn = {
					change_index: 0,
					miner_fees: [this.siaFee.toString(10)],
					siacoin_inputs: this.inputs,
					siacoin_outputs: []
				},
				feeAddress = this.networkFees.api.address,
				change = added.minus(this.fees).minus(this.sendAmount);

			if (added.lt(this.sendAmount.plus(this.fees)))
				throw new Error('not enough confirmed funds to create transaction');

			txn.siacoin_outputs.push({
				unlock_hash: this.recipientAddress,
				value: this.sendAmount.toString(10),
				tag: 'Recipient',
				owned: this.ownsAddress(this.recipientAddress)
			});

			if (this.apiFee.gt(0)) {
				txn.siacoin_outputs.push({
					unlock_hash: feeAddress,
					value: this.apiFee.toString(10),
					tag: 'Broadcast Fee',
					owned: false
				});
			}

			if (change.gt(0)) {
				if (!this.changeAddress || !this.changeAddress.address || !verifyAddress(this.changeAddress.address))
					throw new Error('unable to send transaction. no change address');

				txn.change_index = this.changeAddress.index;
				txn.siacoin_outputs.push({
					unlock_hash: this.changeAddress.address,
					value: change.toString(10),
					tag: 'Change',
					owned: this.ownsAddress(this.changeAddress.address)
				});
			}

			return txn;
		},
		formatCurrencyString(value) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			return formatPriceString(value, 2, this.currency, exchangeRate[this.currency], this.wallet.precision()).value;
		},
		onSendHalf() {
			try {
				const unspentTotal = this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));

				if (unspentTotal.eq(0)) {
					this.sendAmount = new BigNumber(0);
					return;
				}

				this.sendAmount = unspentTotal.div(2).dp(0, BigNumber.ROUND_DOWN);
				this.inputs = this.addInputs(this.sendAmount);

				const { sia, api } = this.calcTxnFees(this.inputs.length);

				this.siaFee = sia;
				this.apiFee = api;

				this.onFormatValues();
			} catch (ex) {
				console.error('onSendHalf', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onSendFull() {
			try {
				const { sia, api, total } = this.calcTxnFees(this.unspent.length),
					unspentTotal = this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));

				if (unspentTotal.eq(0) || unspentTotal.lt(total)) {
					this.sendAmount = new BigNumber(0);
					return;
				}

				this.siaFee = sia;
				this.apiFee = api;
				this.sendAmount = unspentTotal.minus(total);
				this.inputs = this.addInputs(unspentTotal);

				this.onFormatValues();
			} catch (ex) {
				console.error('onSendFull', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		async onSendTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				this.$emit('built', this.buildTransaction());
			} catch (ex) {
				console.error('onSendTxn', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.sending = false;
			}
		},
		onFormatValues() {
			try {
				const siacoins = formatPriceString(this.sendAmount, 2, this.wallet.currency, 1, this.wallet.precision());

				this.$refs.txtCurrency.value = this.formatCurrencyString(this.sendAmount);
				this.$refs.txtSiacoin.value = siacoins.value;
			} catch (ex) {
				console.error('onFormatValues', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onChangeSiacoin() {
			try {
				const value = this.$refs.txtSiacoin.value,
					parsed = parseSiacoinString(value, this.wallet.precision());

				this.sendAmount = parsed;
				this.$refs.txtCurrency.value = this.formatCurrencyString(parsed);
				this.fundTransactionWithFees(this.sendAmount);
			} catch (ex) {
				console.error('onChangeSiacoin', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		},
		onChangeCurrency() {
			try {
				let exchangeRate = this.exchangeRateSC;

				if (this.wallet.currency && this.wallet.currency === 'scp')
					exchangeRate = this.exchangeRateSCP;

				const value = this.$refs.txtCurrency.value,
					parsed = parseCurrencyString(value, exchangeRate[this.currency], this.wallet.precision()),
					siacoins = formatPriceString(parsed, 2, this.wallet.currency, 1, this.wallet.precision());

				this.sendAmount = parsed;
				this.$refs.txtSiacoin.value = siacoins.value;
				this.fundTransactionWithFees(this.sendAmount);
			} catch (ex) {
				console.error('onChangeCurrency', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			}
		}
	},
	watch: {
		address() {
			if (typeof this.address === 'string' && this.address.length > 0)
				this.recipientAddress = this.address;
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

.transaction-buttons {
	margin-top: 5px;
	text-align: right;

	.btn.btn-small {
		font-size: 0.8rem;

		&:last-child {
			margin-right: 0;
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
</style>