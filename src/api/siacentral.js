import { sendJSONRequest } from './common';

export class SiaCentralAPI {
	constructor(baseURL = 'https://api.siacentral.com/v2') {
		this._baseURL = baseURL;
	}

	async checkAvailability() {
		const resp = await sendJSONRequest(`${this._baseURL}/wallet/check`, {
			method: 'GET'
		});

		if (resp.statusCode !== 200 && typeof resp?.body?.message === 'string')
			throw new Error(resp.body.message);
	}

	async getBlock(height) {
		let url = `${this._baseURL}/explorer/blocks`;

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
		const resp = await sendJSONRequest(`${this._baseURL}/market/exchange-rate?currencies=sc,sf`, {
			method: 'GET'
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);

		if (!resp.body || !resp.body.rates)
			throw new Error('unrecognized response');

		return {
			siacoin: resp.body.rates.sc,
			siafund: resp.body.rates.sf
		};
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
			headers: {
				Authorization: `Token ${process.env.VUE_APP_SIACENTRAL_TOKEN}`
			},
			body: {
				transactions
			}
		});

		if (resp.body.type !== 'success')
			throw new Error(resp.body.message);
	}
}

export const siaAPI = new SiaCentralAPI();