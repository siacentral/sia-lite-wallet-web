import { sendJSONRequest } from './common';

export async function broadcastTransaction(baseURL, txns, v2txns) {
	const { statusCode, body } = await sendJSONRequest(`${baseURL}/txpool/broadcast`, {
		method: 'POST',
		body: {
			transactions: txns,
			v2transactions: v2txns
		}
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to broadcast transaction');
	return body;
}

export async function broadcastFee(baseURL) {
	const { statusCode, body } = await sendJSONRequest(`${baseURL}/txpool/fee`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get broadcast fee');
	return body;
}

export async function getExchangeRate(baseURL, currency = 'usd') {
	const { statusCode, body } = await sendJSONRequest(`${baseURL}/exchange-rate/siacoin/${currency}`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get exchange rate');
	return body;
}

export async function tpoolEvents(baseURL) {
	const { statusCode, body } = await sendJSONRequest(`${baseURL}/txpool/events`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get transaction pool');
	return body;
}