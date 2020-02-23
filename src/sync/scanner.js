
import defaultScanner from './default';
import walrusScanner from './walrus';
import Store from '@/store';

const rescanTimeouts = {};

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
	clearTimeout(rescanTimeouts[walletID]);

	const wallet = Store.state.wallets.find(w => w.id === walletID);
	let scanner;

	if (!wallet)
		return;

	switch (wallet.server_type) {
	case 'walrus':
	case 'narwal':
		scanner = walrusScanner;
		break;
	default:
		scanner = defaultScanner;
		break;
	}

	try {
		switch (wallet.type) {
		case 'ledger':
		case 'watch':
			// ledger and watch are manual import types they can't scan for used addresses
			break;
		case 'default':
			if (full)
				await scanner.fullScan(wallet);
			else
				await scanner.quickScan(wallet);

			break;
		default:
			throw new Error('unknown wallet type');
		}

		Store.dispatch('setOffline', false);
	} catch (ex) {
		console.error('scanWallet', wallet.id, ex);
		Store.dispatch('setOffline', true);
	}

	try {
		await scanTransactions(wallet);
		Store.dispatch('setOffline', false);
	} catch (ex) {
		console.error('scanTransactions', wallet.id, ex);
		Store.dispatch('setOffline', true);
	}

	rescanTimeouts[wallet.id] = setTimeout(() => {
		Store.dispatch('queueWallet', { walletID: wallet.id, full: false });
	}, 120000);
}

export async function scanTransactions(wallet) {
	switch (wallet.server_type) {
	case 'walrus':
	case 'narwal':
		return walrusScanner.scanTransactions(wallet);
	default:
		return defaultScanner.scanTransactions(wallet);
	}
}