import { sendJSONRequest } from './common';

export default class {
	constructor(addr) {
		this._baseURL = addr;
	}

	async getAddressUnlockConditions(address) {
		const resp = await sendJSONRequest(`${this._baseURL}/addresses/${address}`, {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return {
			unlock_conditions: {
				public_keys: resp.body.unlockConditions.publicKeys,
				signatures_required: resp.body.unlockConditions.signaturesRequired
			},
			index: resp.body.keyIndex,
			address
		};
	}

	async getAddresses() {
		const addresses = await sendJSONRequest(`${this._baseURL}/addresses`, {
			method: 'GET'
		});

		if (addresses.statusCode < 200 || addresses.statusCode >= 300)
			throw new Error(addresses.body);

		if (!Array.isArray(addresses.body))
			return [];

		const promises = [];

		for (let i = 0; i < addresses.body.length; i++)
			promises.push(this.getAddressUnlockConditions(addresses.body[i]));

		return Promise.all(promises);
	}

	async getUnspentOutputs() {
		const resp = await sendJSONRequest(`${this._baseURL}/utxos`, {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async broadcastTransaction(txn) {
		const resp = await sendJSONRequest(`${this._baseURL}/broadcast`, {
			method: 'POST',
			body: [
				txn
			]
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async getBalance(limbo) {
		limbo = typeof limbo === 'boolean' ? limbo : true;

		const resp = await sendJSONRequest(`${this._baseURL}/balance?limbo=${limbo}`, {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async getTransactions(limit, page) {
		const start = limit * page,
			end = start + limit,
			transactions = await sendJSONRequest(`${this._baseURL}/transactions`, {
				method: 'GET'
			}),
			promises = [];

		if (transactions.statusCode < 200 || transactions.statusCode >= 300)
			throw new Error(transactions.body);

		if (!Array.isArray(transactions.body))
			return [];

		for (let i = start; i < end; i++) {
			if (transactions.body.length >= i)
				break;

			promises.push();
		}
	}

	async addUnlockConditions(unlockConditions, keyIndex) {
		const resp = await sendJSONRequest(`${this._baseURL}/addresses`, {
			method: 'POST',
			body: {
				unlockConditions,
				keyIndex
			}
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async removeAddress(address) {
		const resp = await sendJSONRequest(`${this._baseURL}/addresses/${address}`, {
			method: 'DELETE'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}
};