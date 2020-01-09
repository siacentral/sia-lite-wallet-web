import { getWalletAddresses } from '@/store/db';
import { getTransactions } from '@/utils/sia';
import defaultScanner from './default';
import Store from '@/store';
import Wallet from '@/types/wallet';

const fullTimeouts = {},
	quickTimeouts = {};

let scanning = false;

export async function scanner() {
	if (scanning)
		return;

	scanning = true;

	try {
		const scan = await Store.dispatch('shiftWallet');

		if (!scan)
			return;

		Store.dispatch('saveWallet', {
			id: scan.walletID,
			scanning: scan.full ? 'full' : 'quick'
		});

		await scanWallet(scan.walletID, scan.full);

		Store.dispatch('saveWallet', {
			id: scan.walletID,
			scanning: null
		});
	} finally {
		scanning = false;
	}

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
		Store.dispatch('queueWallet', { walletID: wallet.id, full: false });
	}, 300000);

	if (full) {
		clearTimeout(fullTimeouts[wallet.id]);

		fullTimeouts[wallet.id] = setTimeout(() => {
			Store.dispatch('queueWallet', { walletID: wallet.id, full: true });
		}, 1.8e+6);
	}
}

export async function scanTransactions(wallet) {
	const addresses = await getWalletAddresses(wallet.id);

	if (!Array.isArray(addresses) || addresses.length === 0)
		throw new Error('wallet has no addresses');

	const balance = await getTransactions(addresses.map(a => a.address));

	wallet = new Wallet({
		...wallet,
		...balance
	});

	await Store.dispatch('saveWallet', wallet);
}