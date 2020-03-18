import { sendJSONRequest } from './common';

function singleJoiningSlash(a, b) {
	const aslash = a[a.length - 1] === '/',
		bslash = b[0] === '/';

	if (aslash && bslash)
		return a + b.substring(1);
	else if (!aslash && !bslash)
		return a + '/' + b;

	return a + b;
}

export default class {
	constructor(addr) {
		if (typeof addr !== 'string' || addr.length === 0)
			throw new Error('server address is required');

		this._baseURL = addr;
	}

	async getAddresses() {
		console.log(this._baseURL, '/addresses', singleJoiningSlash(this._baseURL, '/addresses'));
		const addresses = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/addresses'), {
			method: 'GET'
		});

		if (addresses.statusCode < 200 || addresses.statusCode >= 300)
			throw new Error(addresses.body);

		if (!Array.isArray(addresses.body))
			return [];

		return addresses.body;
	}

	async getUnlockConditions() {
		const addresses = await this.getAddresses(),
			unlockConds = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/batchquery/addresses'), {
				method: 'POST',
				body: addresses
			});

		if (unlockConds.statusCode < 200 || unlockConds.statusCode >= 300)
			throw new Error(unlockConds.body);

		if (!Array.isArray(unlockConds.body))
			return [];

		return addresses.reduce((uc, a) => {
			// only supports unlock conditons with 1 signature required for now
			if (unlockConds[a] && unlockConds[a].unlockConditions.signaturesRequired === 1) {
				uc.push({
					address: a,
					unlock_conditions: {
						publickeys: unlockConds[a].unlockConditions.publicKeys,
						signaturesrequired: unlockConds[a].unlockConditions.signaturesRequired
					},
					index: unlockConds[a].keyIndex
				});
			}

			return uc;
		}, []);
	}

	async getUnspentOutputs() {
		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/utxos'), {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async broadcastTransaction(txn) {
		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/broadcast'), {
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

		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, `/balance?limbo=${limbo}`), {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}

	async getTransactions() {
		const transactions = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/batchquery/transactions'), {
			method: 'POST'
		});

		if (transactions.statusCode < 200 || transactions.statusCode >= 300)
			throw new Error(transactions.body);

		if (!Array.isArray(transactions.body))
			return [];
	}

	async addUnlockConditions(unlockConditions, keyIndex) {
		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/addresses'), {
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
		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, `/addresses/${address}`), {
			method: 'DELETE'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		return resp.body;
	}
};