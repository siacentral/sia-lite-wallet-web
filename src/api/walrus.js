import { sendJSONRequest } from './common';
import BigNumber from 'bignumber.js';

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

		if (typeof unlockConds.body !== 'object')
			return [];

		const processed = addresses.reduce((uc, a) => {
			const conditions = unlockConds.body[a];

			// only supports unlock conditons with 1 signature required for now
			if (conditions && conditions.unlockConditions.signaturesRequired === 1) {
				uc.push({
					address: a,
					unlock_conditions: {
						publickeys: conditions.unlockConditions.publicKeys,
						signaturesrequired: conditions.unlockConditions.signaturesRequired
					},
					index: conditions.keyIndex
				});
			}

			return uc;
		}, []);

		processed.sort((a, b) =>
			a.index > b.index ? -1 : a.index < b.index ? 1 : 0);

		return processed;
	}

	async getUnspentOutputs() {
		const resp = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/utxos?limbo=true'), {
			method: 'GET'
		});

		if (resp.statusCode < 200 || resp.statusCode >= 300)
			throw new Error(resp.body);

		if (!Array.isArray(resp.body))
			return [];

		return resp.body.map(u => ({
			output_id: u.ID,
			unlock_hash: u.unlockHash,
			source: 'siacoin_transaction',
			maturity_height: 0,
			block_height: 0,
			value: u.value
		}));
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

	async getTransactions(max) {
		max = max || 500;

		const transactions = await sendJSONRequest(singleJoiningSlash(this._baseURL, `/transactions?max=${max}`), {
			method: 'GET'
		});

		if (transactions.statusCode < 200 || transactions.statusCode >= 300)
			throw new Error(transactions.body);

		if (!Array.isArray(transactions.body))
			return [];

		const txDetails = await sendJSONRequest(singleJoiningSlash(this._baseURL, '/batchquery/transactions'), {
			method: 'POST',
			body: transactions.body
		});

		if (txDetails.statusCode < 200 || txDetails.statusCode >= 300)
			throw new Error(txDetails.body);

		if (typeof txDetails.body !== 'object')
			return [];

		return transactions.body.reduce((transactions, id) => {
			const txn = txDetails.body[id];

			if (!txn)
				return transactions;

			const processed = {
					transaction_id: id,
					block_height: parseInt(txn.blockHeight, 10),
					fees: txn.minerFees,
					siafund_inputs: [],
					siafund_outputs: [],
					timestamp: new Date(txn.timestamp)
				},
				inflow = new BigNumber(txn.inflow),
				outflow = new BigNumber(txn.outflow);

			if (inflow.gt(outflow)) {
				processed.siacoin_value = {
					direction: 'received',
					value: inflow.toString(10)
				};
			} else {
				processed.siacoin_value = {
					direction: 'sent',
					value: outflow.minus(inflow).toString(10)
				};
			}

			if (Array.isArray(txn.siacoinOutputs)) {
				processed.siacoin_outputs = txn.siacoinOutputs.map(o => ({
					value: o.value,
					unlock_hash: o.unlockHash
				}));
			}

			if (Array.isArray(txn.siacoinInputs)) {
				processed.siacoin_inputs = txn.siacoinInputs.map(i => ({
					parent_id: i.parentID,
					unlock_conditions: {
						publickeys: i.unlockConditions.publicKeys,
						signaturesrequired: i.signaturesRequired
					}
				}));
			}

			transactions.push(processed);

			return transactions;
		}, []);
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