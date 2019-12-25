import BigNumber from 'bignumber.js';

export default class Wallet {
	constructor(data) {
		this.id = data.id;
		this.seed = data.seed;
		this.type = data.type;
		this.scanning = data.scanning;
		this.salt = data.salt;
		this.transactions = Array.isArray(data.transactions) ? data.transactions : [];
		this.outputs = Array.isArray(data.outputs) ? data.outputs : [];
		this.spent = Array.isArray(data.spent) ? data.spent : [];
		this.confirmed_balance = new BigNumber(data.confirmed_balance);
		this.unconfirmed_delta = new BigNumber(data.unconfirmed_delta);
		this.unconfirmed_transactions = Array.isArray(data.unconfirmed_transactions) ? data.unconfirmed_transactions : [];
	}

	confirmedBalance() {
		return this.confirmed_balance;
	}

	unconfirmedBalance() {
		return this.confirmed_balance.plus(this.unconfirmed_delta);
	}
};