<template>
	<div>
		<p class="text-warning">{{ translate('defragModal.defragExplain') }}</p>
		<div class="identifier">
			<identicon :value="recipientAddress" />
		</div>
		<div class="control">
			<transition name="fade-top" mode="out-in">
				<label :key="sendTextKey">{{ translate(sendTextKey) }}</label>
			</transition>
			<input type="text" v-model="recipientAddress" :placeholder="translate('sendSiacoinsModal.txtRecipientPlaceholder')" :readonly="!sendOther" />
		</div>
		<div class="control">
			<input v-model="sendOther" type="checkbox" id="chkSendOther" @change="onChangeSendOther" />
			<label for="chkSendOther">Send to Separate Wallet</label>
		</div>
		<div class="extras-info">
			<div># of Outputs</div>
			<div />
			<div class="text-right">{{ formatNumber(unspent.length) }}</div>
			<div># of Transactions</div>
			<div />
			<div class="text-right">{{ formatNumber(transactionCount) }}</div>
			<div>{{ translate('importAddresses.balance') }}</div>
			<div class="text-right" v-html="balanceSC" />
			<div class="text-right" v-html="balanceCurrency" />
			<div>{{ translate('transactionFee') }}</div>
			<div class="text-right" v-html="transactionFeeSC" />
			<div class="text-right" v-html="transactionFeeCurrency" />
			<transition name="fade-top" mode="out-in">
				<div :key="receiveTextKey">{{ translate(receiveTextKey) }}</div>
			</transition>
			<div class="text-right" v-html="sendAmountSC" />
			<div class="text-right" v-html="sendAmountCurrency" />
		</div>
		<div class="transaction-error text-center text-warning">
			<transition name="fade" mode="out-in" appear>
				<div v-if="transactionError" :key="transactionError">{{ transactionError }}</div>
				<div v-else class="error-hidden">hidden</div>
			</transition>
		</div>
		<div class="buttons">
			<button class="btn btn-success btn-inline" :disabled="transactionError || sending" @click="onSendTxn">{{ translate('defrag') }}</button>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { calculateFee, verifyAddress } from '@/utils';
import { formatPriceString, formatNumber } from '@/utils/format';
import { getWalletAddresses } from '@/store/db';

import Identicon from '@/components/Identicon';

export default {
	components: {
		Identicon
	},
	props: {
		wallet: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'networkFees']),
		sendTextKey() {
			return this.sendOther ? 'sendSiacoinsModal.recipientAddress' : 'sendSiacoinsModal.receiveAddress';
		},
		receiveTextKey() {
			return this.sendOther ? 'defragModal.sendAmount' : 'sendSiacoinsModal.remainingBalance';
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

			return unspent;
		},
		balance() {
			return this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));
		},
		balanceSC() {
			const siacoins = formatPriceString(this.balance, 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		balanceCurrency() {
			const currency = formatPriceString(this.balance, 2, this.currency, this.exchangeRateSC[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		sendAmount() {
			return this.balance.minus(this.fees);
		},
		sendAmountSC() {
			const siacoins = formatPriceString(this.sendAmount, 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		sendAmountCurrency() {
			const currency = formatPriceString(this.sendAmount, 2, this.currency, this.exchangeRateSC[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		transactionFeeSC() {
			const siacoins = formatPriceString(this.fees, 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		transactionFeeCurrency() {
			const currency = formatPriceString(this.fees, 2, this.currency, this.exchangeRateSC[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		transactionCount() {
			return Math.ceil(this.unspent.length / 50);
		},
		transactionError() {
			if (this.unspent < 10)
				return this.translate('defragModal.defragUnnecessary');
			if (this.balance.lte(0))
				return this.translate('sendSiacoinsModal.errorGreaterThan0');

			if (this.sendAmount.lt(0))
				return this.translate('sendSiacoinsModal.errorNotEnough');

			if (!verifyAddress(this.recipientAddress))
				return this.translate('sendSiacoinsModal.errorBadRecipient');

			return null;
		},
		apiFee() {
			let apiFeeTotal = new BigNumber(0);

			if (this.wallet.server_type && this.wallet.server_type !== 'siacentral')
				return apiFeeTotal;

			for (let i = 0; i < this.transactionCount; i++) {
				apiFeeTotal = apiFeeTotal.plus(calculateFee(
					this.unspent.length - (50 * i),
					2,
					new BigNumber(this.networkFees.api.fee)
				));
			}

			return apiFeeTotal;
		},
		siaFee() {
			let siaFeeTotal = new BigNumber(0);

			for (let i = 0; i < this.transactionCount; i++) {
				siaFeeTotal = siaFeeTotal.plus(calculateFee(
					this.unspent.length - (50 * i),
					2,
					new BigNumber(this.networkFees.maximum).div(2)
				));
			}

			return siaFeeTotal;
		},
		fees() {
			return this.apiFee.plus(this.siaFee);
		}
	},
	data() {
		return {
			recipientAddress: '',
			sendOther: false,
			sending: false,
			ownedAddresses: []
		};
	},
	async beforeMount() {
		try {
			await this.loadAddresses();
			this.recipientAddress = this.changeAddress.address;
		} catch (ex) {
			console.error('DefragSetup.beforeMount', ex);
			this.pushNotification({
				severity: 'danger',
				message: ex.message
			});
		}
	},
	methods: {
		formatNumber,
		async loadAddresses() {
			this.ownedAddresses = await getWalletAddresses(this.wallet.id);

			if (this.ownedAddresses.length === 0)
				throw new Error('no addresses');
		},
		ownsAddress(address) {
			return this.ownedAddresses.findIndex(a => a.address === address && a.unlock_conditions) !== -1;
		},
		buildTransaction(i, offset) {
			const feeAddress = this.networkFees.api.address,
				inputs = [];
			let sendAmount = new BigNumber(0);

			if (offset > this.unspent.length)
				offset = this.unspent.length;

			for (; i < offset; i++) {
				const output = this.unspent[i],
					addr = this.ownedAddresses.find(a => output.unlock_hash === a.address && a.unlock_conditions);

				if (!addr)
					continue;

				sendAmount = sendAmount.plus(output.value);

				inputs.push({
					...output,
					...addr,
					owned: true
				});
			}

			if (inputs.length === 0)
				throw new Error('no inputs to send');

			const apiFee = calculateFee(
					inputs.length,
					2,
					new BigNumber(this.networkFees.api.fee)),
				siaFee = calculateFee(
					inputs.length,
					2,
					new BigNumber(this.networkFees.minimum));

			if (sendAmount.minus(apiFee).minus(siaFee).lte(0))
				throw new Error('not enough siacoins to defrag');

			return {
				miner_fees: [siaFee.toString(10)],
				siacoin_inputs: inputs,
				siacoin_outputs: [
					{
						unlock_hash: this.recipientAddress,
						value: sendAmount.minus(apiFee).toString(10),
						tag: 'Recipient',
						owned: this.ownsAddress(this.recipientAddress)
					},
					{
						unlock_hash: feeAddress,
						value: apiFee.toString(10),
						tag: 'API Fee',
						owned: false
					}
				]
			};
		},
		formatCurrencyString(value) {
			return formatPriceString(value, 2, this.currency, this.exchangeRateSC[this.currency]).value;
		},
		onChangeSendOther() {
			try {
				if (!this.sendOther)
					this.recipientAddress = this.changeAddress.address;
				else
					this.recipientAddress = '';
			} catch (ex) {
				console.error('DefragSetup.onChangeSendOther', ex);
			}
		},
		async onSendTxn() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				const txns = [];

				for (let i = 0; i < this.transactionCount; i++)
					txns.push(this.buildTransaction(i * 50, (i + 1) * 50));

				this.$emit('built', txns);
			} catch (ex) {
				console.error('onSendTxn', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.sending = false;
			}
		}
	}
};
</script>

<style lang="stylus" scoped>
p {
	margin-bottom: 30px;
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