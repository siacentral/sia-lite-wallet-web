<template>
	<div>
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
			<div>{{ translate('defragModal.outputCount') }}</div>
			<div />
			<div class="text-right">{{ formatNumber(unspent.length) }}</div>
			<div>{{ translate('defragModal.transactionCount') }}</div>
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
			<button class="btn btn-success btn-inline" :disabled="transactionError || sending" @click="onDefrag">{{ translate('defrag') }}</button>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';
import { calculateFee, verifyAddress } from '@/utils';
import { broadcastFee, tpoolEvents } from '@/api/siacentral';
import { formatPriceString, formatNumber } from '@/utils/format';
import { getWalletAddresses } from '@/store/db';

import Identicon from '@/components/Identicon';

const outputsPerTxn = 90;

export default {
	components: {
		Identicon
	},
	props: {
		wallet: Object
	},
	computed: {
		...mapState(['currency', 'exchangeRateSC', 'exchangeRateSCP']),
		sendTextKey() {
			return this.sendOther ? 'sendSiacoinsModal.recipientAddress' : 'sendSiacoinsModal.receiveAddress';
		},
		receiveTextKey() {
			return this.sendOther ? 'defragModal.sendAmount' : 'sendSiacoinsModal.remainingBalance';
		},
		changeAddress() {
			return this.ownedAddresses[0];
		},
		unspent() {
			const outputs = this.wallet && Array.isArray(this.wallet.unspent_siacoin_outputs) ? this.wallet.unspent_siacoin_outputs : [],
				spent = this.wallet && Array.isArray(this.wallet.spent_siacoin_outputs) ? this.wallet.spent_siacoin_outputs : [],
				addrMap = (Array.isArray(this.ownedAddresses) ? this.ownedAddresses : []).reduce((v, a) => {
					v[a.address] = a.index;

					return v;
				}, {}),
				unspent = outputs.reduce((a, o) => {
					if (addrMap[o.unlock_hash] === undefined || spent.indexOf(o.output_id) !== -1 || this.poolSpent.has(o.output_id))
						return a;

					o.index = addrMap[o.unlock_hash];
					a.push(o);

					return a;
				}, []),
				txnCount = Math.ceil(unspent.length / outputsPerTxn),
				ordered = [];

			if (!Array.isArray(unspent) || unspent.length === 0)
				return [];

			unspent.sort((a, b) => {
				const aV = new BigNumber(a.value),
					bV = new BigNumber(b.value);

				if (aV.gt(bV))
					return -1;

				if (aV.lt(bV))
					return 1;

				return 0;
			});

			// take one output from the top for each transaction so each transaction will have one of the largest outputs
			for (let i = 0; i < txnCount; i++)
				ordered.push([unspent.shift()]);

			// fill the other outputs from the bottom so the largest output should be paired with the smallest outputs
			for (let i = unspent.length - 1, j = 0; i >= 0; i--) {
				ordered[j].push(unspent[i]);

				if (ordered[j].length >= outputsPerTxn)
					j++;
			}

			return ordered.reduce((v, o) => v.concat(o), []);
		},
		balance() {
			return this.unspent.reduce((v, u) => v.plus(u.value), new BigNumber(0));
		},
		balanceSC() {
			const siacoins = formatPriceString(this.balance, 2);

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		balanceCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(this.balance, 2, this.currency, exchangeRate[this.currency]);

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		sendAmountSC() {
			const siacoins = formatPriceString(this.sendAmount, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		sendAmountCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(this.sendAmount, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		transactionFeeSC() {
			const siacoins = formatPriceString(this.fees, 2, this.wallet.currency, 1, this.wallet.precision());

			return `${siacoins.value} <span class="currency-display">${this.translate('currency.sc')}</span>`;
		},
		transactionFeeCurrency() {
			let exchangeRate = this.exchangeRateSC;

			if (this.wallet.currency && this.wallet.currency === 'scp')
				exchangeRate = this.exchangeRateSCP;

			const currency = formatPriceString(this.fees, 2, this.currency, exchangeRate[this.currency], this.wallet.precision());

			return `${currency.value} <span class="currency-display">${this.translate(`currency.${currency.label}`)}</span>`;
		},
		transactionCount() {
			return Math.ceil(this.unspent.length / outputsPerTxn);
		},
		transactionError() {
			if (this.unspent.length < 90)
				return this.translate('defragModal.defragUnnecessary');

			if (this.balance.lte(0))
				return this.translate('sendSiacoinsModal.errorGreaterThan0');

			if (this.sendAmount.lte(0))
				return this.translate('sendSiacoinsModal.errorNotEnough');

			if (!verifyAddress(this.recipientAddress))
				return this.translate('sendSiacoinsModal.errorBadRecipient');

			return null;
		}
	},
	data() {
		return {
			recipientAddress: '',
			sendOther: false,
			sending: false,
			sendAmount: new BigNumber(0),
			fees: new BigNumber(0),
			feePerByte: new BigNumber(0),
			ownedAddresses: [],
			poolSpent: new Set(),
			transactions: []
		};
	},
	async beforeMount() {
		try {
			this.feePerByte = new BigNumber(await broadcastFee());

			await this.loadPoolSpent();
			await this.loadAddresses();
			this.recipientAddress = this.changeAddress.address;

			this.defrag();
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
		// outputs already spent by transactions waiting in the pool cannot be
		// defragged again; the wallet's cached spent list does not include them
		async loadPoolSpent() {
			const events = await tpoolEvents(),
				spent = new Set();

			for (const event of events) {
				if (event.type === 'v1Transaction') {
					for (const input of event.data?.transaction?.siacoinInputs || [])
						spent.add(input.parentID);
				} else if (event.type === 'v2Transaction') {
					for (const input of event.data?.siacoinInputs || [])
						spent.add(input.parent.id);
				}
			}

			this.poolSpent = spent;
		},
		async loadAddresses() {
			this.ownedAddresses = await getWalletAddresses(this.wallet.id);

			if (this.ownedAddresses.length === 0)
				throw new Error('no addresses');
		},
		ownsAddress(address) {
			return this.ownedAddresses.findIndex(a => a.address === address && a.unlock_conditions) !== -1;
		},
		buildTransaction(start, end) {
			const inputs = [];
			let sendAmount = new BigNumber(0);

			if (end > this.unspent.length)
				end = this.unspent.length;

			for (let i = start; i < end; i++) {
				const output = this.unspent[i],
					addr = this.ownedAddresses.find(a => output.unlock_hash === a.address && a.unlock_conditions);

				if (!addr)
					continue;

				sendAmount = sendAmount.plus(output.value);

				inputs.push({
					parentID: output.output_id,
					unlockConditions: addr.unlock_conditions,
					address: output.unlock_hash,
					value: output.value,
					owned: true,
					index: addr.index
				});
			}

			if (inputs.length === 0)
				throw new Error('no inputs to send');

			const fee = calculateFee(inputs.length, 1, this.feePerByte);

			if (sendAmount.minus(fee).lte(0))
				throw new Error('not enough siacoins to defrag');

			const recipient = this.ownedAddresses.find(a => a.address === this.recipientAddress);

			return {
				txn: {
					changeIndex: recipient ? recipient.index : 0,
					minerFees: [fee.toString(10)],
					siacoinInputs: inputs,
					siacoinOutputs: [
						{
							address: this.recipientAddress,
							value: sendAmount.minus(fee).toString(10),
							tag: 'Recipient',
							owned: this.ownsAddress(this.recipientAddress)
						}
					]
				},
				sent: sendAmount.minus(fee),
				fees: fee
			};
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
		defrag() {
			try {
				const txns = [];
				let totalSent = new BigNumber(0),
					totalFees = new BigNumber(0),
					showWarning = false;

				for (let i = 0; i < this.transactionCount; i++) {
					try {
						const { txn, sent, fees } = this.buildTransaction(i * outputsPerTxn, (i + 1) * outputsPerTxn);

						totalSent = totalSent.plus(sent);
						totalFees = totalFees.plus(fees);

						txns.push(txn);
					} catch (ex) {
						console.error('DefragSetup.defrag', ex);
						showWarning = true;
					}
				}

				if (showWarning) {
					this.pushNotification({
						severity: 'warning',
						message: 'Defragmenting only partially complete, too many dust outputs.'
					});
				}

				this.transactions = txns;
				this.sendAmount = totalSent;
				this.fees = totalFees;
			} catch (ex) {
				console.error('DefragSetup.defrag', ex);
				this.pushNotification({
					severity: 'danger',
					message: 'Unable to defragment wallet'
				});
			}
		},
		onDefrag() {
			if (this.sending)
				return;

			this.sending = true;

			try {
				this.$emit('built', {
					transactions: this.transactions,
					recipient: this.recipientAddress
				});
			} catch (ex) {
				console.error('DefragSetup.onDefrag', ex);
				this.pushNotification({
					severity: 'danger',
					message: ex.message
				});
			} finally {
				this.sending = false;
			}
		}
	},
	watch: {
		recipientAddress() {
			this.defrag();
		}
	}
};
</script>

<style lang="stylus" scoped>
p {
	margin-bottom: 30px;
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
