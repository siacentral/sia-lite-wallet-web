import { sendJSONRequest } from './common';

const baseURL = 'https://api.siacentral.com';

export function getBlock(height) {
	let url = `${baseURL}/v2/explorer/block`;

	if (height)
		url += `?height=${height}`;

	return sendJSONRequest(url, {
		method: 'GET'
	});
}

export async function getCoinPrice() {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/market/exchange-rate`, {
		method: 'GET'
	});

	if (resp.type !== 'success')
		throw new Error(resp.message);

	return resp.price;
}

export async function getNetworkFees() {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/wallet/fees`, {
		method: 'GET'
	});

	if (resp.type !== 'success')
		throw new Error(resp.message);

	return {
		minimum: resp.minimum,
		maximum: resp.maximum,
		api: resp.api
	};
}

export async function broadcastTransaction(transaction, parents) {
	const resp = await sendJSONRequest(`https://api.siacentral.com/v2/wallet/broadcast`, {
		method: 'POST',
		body: {
			transaction,
			parents
		}
	});

	if (resp.type !== 'success')
		throw new Error(resp.message);

	console.log(resp);
}