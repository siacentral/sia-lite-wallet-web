import BigNumber from 'bignumber.js';

import { getWalletAddresses } from '@/store/db';
import { getTransactions } from '@/utils/sia';
import defaultScanner from './default';
import Store from '@/store';

const scanQueue = [],
	fullTimeouts = {},
	quickTimeouts = {};

let scanning = false;

export function queueWallet(walletID, full) {
	full = typeof full === 'boolean' ? full : false;

	if (scanQueue.findIndex(w => w.id === walletID && w.full === full) !== -1)
		return;

	scanQueue.push({
		walletID,
		full
	});

	scanner();
}

async function scanner() {
	if (scanning)
		return;

	scanning = true;

	try {
		const scan = scanQueue.shift();

		Store.dispatch('saveWallet', {
			id: scan.walletID,
			scanning: true
		});

		await scanWallet(scan.walletID, scan.full);

		Store.dispatch('saveWallet', {
			id: scan.walletID,
			scanning: false
		});
	} finally {
		scanning = false;
	}

	if (Array.isArray(scanQueue) && scanQueue.length !== 0)
		scanner();
}

export async function scanWallet(walletID, full) {
	const wallet = Store.state.wallets.find(w => w.id === walletID);

	if (!wallet)
		return;

	try {
		switch (wallet.type) {
		case 'ledger':
		case 'watch':
			// ledger and watch are manual import types they can't scan for used addresses
			break;
		case 'default':
			if (full)
				await defaultScanner.fullScan(wallet);
			else
				await defaultScanner.quickScan(wallet);

			break;
		default:
			throw new Error('unknown wallet type');
		}
	} catch (ex) {
		console.error('scanWallet', wallet.id, ex);
	}

	try {
		await scanTransactions(wallet);
	} catch (ex) {
		console.error('scanTransactions', wallet.id, ex);
	}

	clearTimeout(quickTimeouts[wallet.id]);

	quickTimeouts[wallet.id] = setTimeout(() => {
		queueWallet(wallet.id, false);
	}, 300000);

	if (full) {
		clearTimeout(fullTimeouts[wallet.id]);

		fullTimeouts[wallet.id] = setTimeout(() => {
			queueWallet(wallet.id, true);
		}, 1.8e+6);
	}
}

export async function scanTransactions(wallet) {
	const addresses = await getWalletAddresses(wallet.id);

	if (!Array.isArray(addresses) || addresses.length === 0)
		throw new Error('wallet has no addresses');

	const mapped = addresses.map(a => a.address),
		balance = await getTransactions(mapped);

	let confirmed = new BigNumber(balance.confirmed_balance),
		unconfirmed = new BigNumber(balance.unconfirmed_delta);

	if (confirmed.isNaN() || !confirmed.isFinite())
		confirmed = new BigNumber(0);

	if (unconfirmed.isNaN() || !unconfirmed.isFinite())
		unconfirmed = new BigNumber(0);

	await Store.dispatch('saveWallet', {
		...wallet,
		transactions: balance.transactions,
		outputs: balance.unspent_outputs,
		unconfirmed_spent: balance.unconfirmed_spent,
		spent: balance.unconfirmed_spent,
		confirmed_balance: confirmed,
		unconfirmed_delta: unconfirmed
	});
}