<template>
	<div>
		<div class="identifier">
			<identicon :value="recipientAddress" />
		</div>
		<div class="control">
			<label>{{ translate('sendSiacoinsModal.recipientAddress') }}</label>
			<input type="text" v-model="recipientAddress" :placeholder="translate('sendSiacoinsModal.txtRecipientPlaceholder')" />
		</div>
		<div class="switch-currency-buttons" v-if="hasSF">
			<button class="btn btn-small btn-inline" @click="onChangeSendMode('sc')">Send Siacoins</button>
			<button class="btn btn-small btn-inline" @click="onChangeSendMode('sf')">Send Siafunds</button>
		</div>
		<label>{{ translate('amount') }}</label>
		<div v-if="sendMode === 'sc'" class="currency-control">
			<input ref="txtSiacoin" type="text" value="0 SC" @input="onChangeSiacoin" @blur="onFormatValues" />
			<label>{{ baseCurrencyLabel }}</label>
			<input ref="txtCurrency" type="text" value="$0.00" @input="onChangeCurrency" @blur="onFormatValues" />
			<label>{{ translate(`currency.${currency}`) }}</label>
			<div class="transaction-buttons">
				<button class="btn btn-small btn-inline" @click="onSendHalf">{{ translate('half') }}</button>
				<button class="btn btn-small btn-inline" @click="onSendFull">{{ translate('full') }}</button>
			</div>
		</div>
		<div v-else-if="sendMode === 'sf'" class="single-currency-control">
			<input ref="txtSiafund" type="text" value="0 SF" @input="onChangeSiafund" @blur="onFormatValues" />
			<label>SF</label>
		</div>
		<div class="extras-info">
			<div>{{ translate('transactionFee') }}</div>
			<div class="text-right" v-html="transactionFeeSC" />
			<div class="text-right" v-html="transactionFeeCurrency" />
			<div>{{ translate('sendSiacoinsModal.remainingBalance') }}</div>
			<div class="text-right" v-html="remainingBalanceSC" />
			<div class="text-right" v-html="remainingBalanceCurrency" />
			<div v-if="hasSF">Siafund Balance</div>
			<div class="text-right" v-html="remainingBalanceSF" v-if="hasSF"/>
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
import { verifyAddress } from '@/utils';
import { broadcastFee, tpoolEvents } from '@/api/siacentral';
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
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
		baseCurrencyLabel() {
			return this.translate('currency.sc');
		},
		walletBalance() {
			return this.wallet.unconfirmedSiacoinBalance();
		},
		walletSFBalance() {
			return this.wallet.unconfirmedSiafundBalance();
		},
		hasSF() {
			return this.walletSFBalance && this.walletSFBalance.gt(0);
		},
		changeAddress() {
			return this.ownedAddresses[0];
		},
		transactionFeeSC() {
			const siacoins = formatPriceString(this.fees, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate(`currency.${siacoins.label}`)}</span>`;
		},
		transactionFeeCurrency() {
			const exchangeRate = this.exchangeRateSC,
				currency = formatPriceString(this.fees, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

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
		remainingBalanceSF() {
			const rem = this.walletSFBalance.minus(this.sendSFAmount),
				siafunds = formatPriceString(rem, 2, 'sf', 1, 1);

			return `${siafunds.value} <span class="currency-display">SF</span>`;
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
			if (this.sendMode === 'sc') {
				if (this.sendAmount.lte(0))
					return this.translate('sendSiacoinsModal.errorGreaterThan0');
				else if (this.sendAmount.lt(this.fees))
					return this.translate('sendSiacoinsModal.errorHighFee');
				else if (this.sendSFAmount !== 0)
					return 'You cannot send Siafunds with a Siacoin transaction';
			} else if (this.sendMode === 'sf') {
				if (this.sendSFAmount <= 0)
					return 'Send amount must be greater than 0';
				else if (this.sendSFAmount > this.walletSFBalance)
					return 'Not enough Siafunds to send';
				else if (this.sendAmount.gt(0))
					return 'You cannot send Siacoins with a Siafund transaction';
			} else
				return 'Invalid send mode';

			if (this.sendAmount.plus(this.fees).gt(this.walletBalance))
				return this.translate('sendSiacoinsModal.errorNotEnough');

			if (!verifyAddress(this.recipientAddress))
				return this.translate('sendSiacoinsModal.errorBadRecipient');

			if (this.inputs.length >= 95)
				return this.translate('sendSiacoinsModal.errorTooManyInputs');

			return null;
		}
	},
	data() {
		return {
			sendMode: 'sc',
			recipientAddress: '',
			unspent: [],
			unspentSF: [],
			inputs: [],
			sfInputs: [],
			sendAmount: new BigNumber(0),
			sendSFAmount: 0,
			sending: false,
			ownedAddresses: [],
			fees: new BigNumber(0)
		};
	},
	async beforeMount() {
		const maxFee = new BigNumber(10).pow(24),
			fee = await broadcastFee();
		this.fees = new BigNumber(fee).multipliedBy(2000);
		if (this.fees.gt(maxFee))
			this.fees = maxFee;

		const events = await tpoolEvents(),
			spent = new Set();
		for (const event of events) {
			if (event.type === 'v1Transaction') {
				for (const input of event.data?.transaction?.siacoinInputs || [])
					spent.add(input.parentID);
				for (const input of event.data?.transaction?.siafundInputs || [])
					spent.add(input.parentID);
			} else if (event.type === 'v2Transaction') {
				for (const input of event.data?.siacoinInputs || [])
					spent.add(input.parent.id);
				for (const input of event.data?.siafundInputs || [])
					spent.add(input.parent.id);
			}
		}

		const sfOutputs = this.wallet && Array.isArray(this.wallet.unspent_siafund_outputs) ? this.wallet.unspent_siafund_outputs : [],
			unspentSF = sfOutputs.filter(o => !spent.has(o.output_id));

		unspentSF.sort((a, b) => {
			if (a.value > b.value)
				return -1;
			if (a.value < b.value)
				return 1;
			return 0;
		});
		this.unspentSF = unspentSF;

		const outputs = this.wallet && Array.isArray(this.wallet.unspent_siacoin_outputs) ? this.wallet.unspent_siacoin_outputs : [],
			unspent = outputs.filter(o => !spent.has(o.output_id));

		unspent.sort((a, b) => {
			a = new BigNumber(a.value);
			b = new BigNumber(b.value);

			if (a.gt(b))
				return -1;

			if (a.lt(b))
				return 1;

			return 0;
		});
		this.unspent = unspent;
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
		addInputs(amount) {
			const inputs = [];
			let added = new BigNumber(0);

			for (let i = 0; i < this.unspent.length; i++) {
				const output = this.unspent[i],
					addr = this.ownedAddresses.find(a => a.address === output.unlock_hash && a.unlock_conditions);

				if (!addr)
					continue;

				added = added.plus(output.value);
				inputs.push({
					parentID: output.output_id,
					unlockConditions: addr.unlock_conditions,
					address: output.unlock_hash,
					value: output.value,
					owned: true,
					index: addr.index
				});

				if (added.gte(amount))
					break;
			}
			return inputs;
		},
		addSFInputs(amount) {
			if (!this.changeAddress || !this.changeAddress.address || !verifyAddress(this.changeAddress.address))
				throw new Error('unable to send transaction. no change address');

			const inputs = [];
			let added = 0;

			for (const output of this.unspentSF) {
				if (added >= amount)
					break;

				const addr = this.ownedAddresses.find(a => a.address === output.unlock_hash && a.unlock_conditions);

				if (!addr)
					continue;

				added += output.value;
				inputs.push({
					parentID: output.output_id,
					unlockConditions: addr.unlock_conditions,
					address: output.unlock_hash,
					claimAddress: this.changeAddress.address,
					value: output.value,
					owned: true,
					index: addr.index
				});
			}

			return inputs;
		},
		fundTransactionWithFees(amount) {
			this.inputs = this.addInputs(amount.plus(this.fees));
		},
		fundTransactionSF(amount) {
			this.sfInputs = this.addSFInputs(amount);
		},
		buildTransaction() {
			const added = this.inputs.reduce((v, i) => v.plus(i.value), new BigNumber(0)),
				addedSF = this.sfInputs.reduce((v, i) => v + i.value, 0),
				txn = {
					changeIndex: 0,
					minerFees: [this.fees.toString(10)],
					siacoinInputs: this.inputs,
					siacoinOutputs: []
				},
				change = added.minus(this.fees).minus(this.sendAmount),
				changeSF = addedSF - this.sendSFAmount;

			if (added.lt(this.sendAmount.plus(this.fees)))
				throw new Error('not enough confirmed Siacoins to create transaction');

			if (!this.changeAddress || !this.changeAddress.address || !verifyAddress(this.changeAddress.address))
				throw new Error('unable to send transaction. no change address');

			if (this.sendMode === 'sc') {
				txn.siacoinOutputs.push({
					address: this.recipientAddress,
					value: this.sendAmount.toString(10),
					tag: 'Recipient',
					owned: this.ownsAddress(this.recipientAddress)
				});
			} else if (this.sendMode === 'sf') {
				if (addedSF < this.sendSFAmount)
					throw new Error('not enough confirmed Siafunds to create transaction');

				txn.siafundInputs = this.sfInputs;
				txn.siafundOutputs = [{
					address: this.recipientAddress,
					value: this.sendSFAmount,
					tag: 'Recipient',
					owned: this.ownsAddress(this.recipientAddress)
				}];

				if (changeSF > 0) {
					txn.changeIndex = this.changeAddress.index;
					txn.siafundOutputs.push({
						address: this.changeAddress.address,
						value: changeSF,
						tag: 'Change',
						owned: true
					});
				}
			}

			if (change.gt(0)) {
				txn.changeIndex = this.changeAddress.index;
				txn.siacoinOutputs.push({
					address: this.changeAddress.address,
					value: change.toString(10),
					tag: 'Change',
					owned: true
				});
			}
			console.log('built transaction', txn);
			return txn;
		},
		formatCurrencyString(value) {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			return formatPriceString(value, 2, this.currency, exchangeRate[this.currency], this.wallet.precision()).value;
		},
		onChangeSendMode(mode) {
			this.sendAmount = new BigNumber(0);
			this.sendSFAmount = 0;
			this.sendMode = mode;
			this.inputs = this.addInputs(this.fees);
			this.onFormatValues();
		},
		onSendHalf() {
			try {
				const unspentTotal = this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));

				if (unspentTotal.eq(0)) {
					this.sendAmount = new BigNumber(0);
					return;
				}

				this.sendAmount = unspentTotal.div(2).dp(0, BigNumber.ROUND_DOWN);
				this.inputs = this.addInputs(this.sendAmount.plus(this.fees));

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
				const unspentTotal = this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));

				if (unspentTotal.eq(0) || unspentTotal.lt(this.fees)) {
					this.sendAmount = new BigNumber(0);
					return;
				}

				this.sendAmount = unspentTotal.minus(this.fees);
				this.inputs = this.addInputs(unspentTotal.plus(this.fees));

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
				setTimeout(() => {
					const siacoins = formatPriceString(this.sendAmount, 2, this.wallet.currency, 1, this.wallet.precision());
					if (this.sendMode === 'sc') {
						this.$refs.txtCurrency.value = this.formatCurrencyString(this.sendAmount);
						this.$refs.txtSiacoin.value = siacoins.value;
					} else if (this.sendMode === 'sf')
						this.$refs.txtSiafund.value = formatPriceString(new BigNumber(this.sendSFAmount), 2, 'sf', 1, 1).value;
				}, 0);
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
		onChangeSiafund() {
			try {
				const value = this.$refs.txtSiafund.value;
				console.log('siafunds', value);
				this.sendSFAmount = parseInt(value, 10);
				this.fundTransactionSF(this.sendSFAmount);
			} catch (ex) {
				console.error('onChangeSiafund', ex);
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
.single-currency-control {
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
		border-radius: 4px;
	}
}

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