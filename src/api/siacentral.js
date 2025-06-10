import { sendJSONRequest } from './common';

const WALLETD_BASE_URL = 'http://localhost:9980/api';

export async function broadcastTransaction(txns, v2txns) {
	const { statusCode, body } = await sendJSONRequest(`${WALLETD_BASE_URL}/txpool/broadcast`, {
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

export async function broadcastFee() {
	const { statusCode, body } = await sendJSONRequest(`${WALLETD_BASE_URL}/txpool/fee`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get broadcast fee');
	return body;
}

export async function getExchangeRate(currency = 'usd') {
	const { statusCode, body } = await sendJSONRequest(`https://api.siascan.com/exchange-rate/siacoin/${currency}`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get exchange rate');
	return body;
}

export async function tpoolEvents() {
	const { statusCode, body } = await sendJSONRequest(`${WALLETD_BASE_URL}/txpool/events`, {
		method: 'GET'
	});
	if (statusCode !== 200)
		throw new Error(body || 'Failed to get transaction pool');
	return body;
}