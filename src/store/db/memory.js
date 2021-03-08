export default class MemoryStore {
	async init() {
		this._wallets = {};
		this._addresses = {};
	}

	async saveWallet(wallet) {
		this._wallets[wallet.id] = wallet;
	}

	async getWallets(password) {
		const keys = Object.keys(this._wallets);

		return keys.map(k => this._wallets[k]);
	}

	async walletCount() {
		return Object.keys(this._wallets).length;
	}

	async saveAddresses(addresses) {
		addresses.forEach(a => {
			this._addresses[a.address] = a;
		});
	}

	async getWalletAddresses(walletID) {
		return Object.keys(this._addresses).reduce((v, a) => {
			const r = this._addresses[a];

			if (r.wallet_id === walletID)
				v.push(r);

			return v;
		}, []);
	}

	async getWalletUnlockHashes(walletID) {
		return Object.keys(this._addresses).reduce((v, a) => {
			const r = this._addresses[a];

			if (r.wallet_id === walletID)
				v.push(a);

			return v;
		}, []);
	}

	async getAddresses(walletID, addresses) {
		return Object.keys(this._addresses).reduce((v, a) => {
			const r = this._addresses[a];

			if (r.wallet_id === walletID && addresses.indexOf(a))
				v.push(a);

			return v;
		}, []);
	}

	async getWalletChangeAddress(walletID) {
		const addresses = await this.getWalletAddresses(walletID);

		addresses.sort((a, b) => a.index > b.index ? -1 : a.index < b.index ? 1 : 0);

		return addresses[0];
	}

	async getLastWalletAddresses(walletID, limit, offset) {
		const addresses = await this.getWalletAddresses(walletID);

		addresses.sort((a, b) => a.index > b.index ? -1 : a.index < b.index ? 1 : 0);

		return addresses.splice(offset, limit);
	}

	async deleteWallet(walletID) {
		const addresses = await this.getWalletAddresses(walletID);

		addresses.forEach(a => {
			if (a.wallet_id === walletID)
				delete this._addresses[a.address];
		});

		delete this._wallets[walletID];
	}

	reset() {
		this._wallets = {};
		this._addresses = {};
	}
}