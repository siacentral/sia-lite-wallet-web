import BigNumber from 'bignumber.js';

export default class Wallet {
	constructor(data) {
		this.id = data.id;
		this.seed = data.seed;
		this.type = data.type;
		this.title = data.title;
		this.scanning = data.scanning;
		this.salt = data.salt;
		this.server_type = data.server_type || 'siacentral';
		this.currency = data.currency || 'sc';
		this.server_url = data.server_url;
		this.transactions = Array.isArray(data.transactions) ? data.transactions : [];
		this.unspent_siacoin_outputs = Array.isArray(data.unspent_siacoin_outputs) ? data.unspent_siacoin_outputs : [];
		this.unspent_siafund_outputs = Array.isArray(data.unspent_siafund_outputs) ? data.unspent_siafund_outputs : [];
		this.spent_siacoin_outputs = Array.isArray(data.spent_siacoin_outputs) ? data.spent_siacoin_outputs : [];
		this.spent_siafund_outputs = Array.isArray(data.spent_siafund_outputs) ? data.spent_siafund_outputs : [];
		this.confirmed_siafund_balance = new BigNumber(data.confirmed_siafund_balance);
		this.confirmed_siacoin_balance = new BigNumber(data.confirmed_siacoin_balance);
		this.unconfirmed_siacoin_delta = new BigNumber(data.unconfirmed_siacoin_delta);
		this.unconfirmed_siafund_delta = new BigNumber(data.unconfirmed_siafund_delta);
	}

	precision() {
		if (this.currency && this.currency === 'scp')
			return new BigNumber(1e27);

		return new BigNumber(1e24);
	}

	confirmedSiacoinBalance() {
		const balance = new BigNumber(this.confirmed_siacoin_balance);

		if (!balance || balance.isNaN())
			return new BigNumber(0);

		return balance;
	}

	unconfirmedSiacoinBalance() {
		let balance = new BigNumber(this.confirmed_siacoin_balance),
			delta = new BigNumber(this.unconfirmed_siacoin_delta);

		if (!balance || balance.isNaN())
			balance = new BigNumber(0);

		if (!delta || delta.isNaN())
			delta = new BigNumber(0);

		return balance.plus(delta);
	}

	confirmedSiafundBalance() {
		const balance = new BigNumber(this.confirmed_siafund_balance);

		if (!balance || balance.isNaN())
			return new BigNumber(0);

		return balance;
	}

	unconfirmedSiafundBalance() {
		let balance = new BigNumber(this.confirmed_siafund_balance),
			delta = new BigNumber(this.unconfirmed_siafund_delta);

		if (!balance || balance.isNaN())
			balance = new BigNumber(0);

		if (!delta || delta.isNaN())
			delta = new BigNumber(0);

		return balance.plus(delta);
	}
};