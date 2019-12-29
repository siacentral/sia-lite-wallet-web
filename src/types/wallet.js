import BigNumber from 'bignumber.js';

export default class Wallet {
	constructor(data) {
		this.id = data.id;
		this.seed = data.seed;
		this.type = data.type;
		this.title = data.title;
		this.scanning = data.scanning;
		this.salt = data.salt;
		this.transactions = Array.isArray(data.transactions) ? data.transactions : [];
		this.outputs = Array.isArray(data.outputs) ? data.outputs : [];
		this.unconfirmed_spent = Array.isArray(data.unconfirmed_spent) ? data.unconfirmed_spent : [];
		this.confirmed_balance = new BigNumber(data.confirmed_balance);
		this.unconfirmed_delta = new BigNumber(data.unconfirmed_delta);
		this.unconfirmed_transactions = Array.isArray(data.unconfirmed_transactions) ? data.unconfirmed_transactions : [];
	}

	confirmedBalance() {
		if (!this.confirmed_balance || this.confirmed_balance.isNaN())
			return new BigNumber(0);

		return this.confirmed_balance;
	}

	unconfirmedBalance() {
		if (!this.confirmed_balance || this.confirmed_balance.isNaN())
			return new BigNumber(0);

		if (!this.unconfirmed_delta || this.unconfirmed_delta.isNaN())
			return new BigNumber(0);

		return this.confirmed_balance.plus(this.unconfirmed_delta);
	}
};