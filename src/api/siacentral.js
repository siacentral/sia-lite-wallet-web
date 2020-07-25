import { sendJSONRequest } from './common';

export class SiaCentralAPI {
	constructor(baseURL = 'https://api.siacentral.com/v2') {
		this._baseURL = baseURL;
	}

	async getBlock(height) {
		let url = `${this._baseURL}/v2/explorer/blocks`;

		if (height)
			url += `?height=${height}`;

		const resp = await sendJSONRequest(url, {
			method: 'GET'
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);

		return resp.body.block;
	}

	async getCoinPrice() {
		const resp = await sendJSONRequest(`${this._baseURL}/market/exchange-rate`, {
			method: 'GET'
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);

		return resp.body;
	}

	async getNetworkFees() {
		const resp = await sendJSONRequest(`${this._baseURL}/wallet/fees`, {
			method: 'GET'
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);

		return {
			minimum: resp.body.minimum,
			maximum: resp.body.maximum,
			api: resp.body.api
		};
	}

	async getFeeAddresses() {
		const resp = await sendJSONRequest(`${this._baseURL}/wallet/fees/collected`, {
			method: 'GET'
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);

		return resp.body.collected.map(a => a.address);
	}

	async broadcastTransaction(transactions) {
		const resp = await sendJSONRequest(`${this._baseURL}/wallet/broadcast`, {
			method: 'POST',
			body: {
				transactions
			}
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);
	}
}

export const siaAPI = new SiaCentralAPI();
export const scprimeAPI = new SiaCentralAPI('https://api.siacentral.com/v2/scprime');