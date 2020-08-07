import Dexie from 'dexie';
import { unlockWallet } from './common';

export default class DexieStore {
	async init() {
		this._db = new Dexie('sia-lite', { autoOpen: false });
		this._db.version(1).stores({
			wallets: 'id',
			addresses: '[address+wallet_id],wallet_id,index'
		});

		await this._db.open();
	}

	saveWallet(wallet) {
		return this._db.wallets.put(wallet);
	}

	async getWallets(password) {
		const wallets = await this._db.wallets.toArray(),
			promises = [];

		for (let i = 0; i < wallets.length; i++)
			promises.push(unlockWallet(wallets[i], password));

		return Promise.all(promises);
	}

	walletCount() {
		return this._db.wallets.count();
	}

	saveAddresses(addresses) {
		if (!Array.isArray(addresses) || addresses.length === 0)
			return;

		return this._db.addresses.bulkPut(addresses);
	}

	getWalletAddresses(walletID) {
		return this._db.addresses.filter(a => a.wallet_id === walletID)
			.sortBy('index');
	}

	getWalletUnlockHashes(walletID) {
		return this._db.addresses.filter(a => a.wallet_id === walletID).keys();
	}

	getAddresses(walletID, addresses) {
		if (!Array.isArray(addresses))
			addresses = [addresses];

		return this._db.addresses.filter(a => a.wallet_id === walletID && addresses.indexOf(a.address) !== -1).toArray();
	}

	async getWalletChangeAddress(walletID) {
		let addr = await this._db.addresses.orderBy('index').filter(a => a.wallet_id === walletID && a.usage_type !== 'sent').first();

		if (!addr)
			addr = await this._db.addresses.orderBy('index').filter(a => a.wallet_id === walletID).last();

		return addr;
	}

	getLastWalletAddresses(walletID, limit, offset) {
		offset = offset || 0;
		limit = limit || 20;

		return this._db.addresses.orderBy('index').reverse().filter(a => a.wallet_id === walletID).offset(offset).limit(limit).toArray();
	}

	deleteWallet(walletID) {
		return Promise.all([
			this._db.addresses.filter(a => a.wallet_id === walletID).delete(),
			this._db.wallets.filter(w => w.id === walletID).delete()
		]);
	}
}