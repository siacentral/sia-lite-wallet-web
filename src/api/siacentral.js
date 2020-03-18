import { sendJSONRequest } from './common';

const baseURL = 'https://api.siacentral.com';

export async function getBlock(height) {
	let url = `${baseURL}/v2/explorer/blocks`;

	if (height)
		url += `?height=${height}`;

	const resp = await sendJSONRequest(url, {
		method: 'GET'
	});

	if (resp.body.type !== 'success')
		throw new Error(resp.body.message);

	return resp.body.block;
}

export async function getCoinPrice() {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/market/exchange-rate`, {
		method: 'GET'
	});

	if (resp.body.type !== 'success')
		throw new Error(resp.body.message);

	return resp.body;
}

export async function getNetworkFees() {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/wallet/fees`, {
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

export async function getFeeAddresses() {
	const resp = await sendJSONRequest('https://api.siacentral.com/v2/wallet/fees/collected', {
		method: 'GET'
	});

	if (resp.body.type !== 'success')
		throw new Error(resp.body.message);

	return resp.body.collected.map(a => a.address);
}

export async function broadcastTransaction(transactions) {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/wallet/broadcast`, {
		method: 'POST',
		body: {
			transactions
		}
	});

	if (resp.body.type !== 'success')
		throw new Error(resp.body.message);
}