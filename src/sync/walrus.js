import WalrusClient from '@/api/walrus';
import { saveAddresses } from '@/store/db';
import Store from '@/store';

async function scan(wallet) {
	const walrus = new WalrusClient(wallet.server_url),
		addresses = await walrus.getUnlockConditions();

	await saveAddresses(addresses.map(a => ({
		...a,
		wallet_id: wallet.id
	})));
}

export default {
	quickScan: scan,
	fullScan: scan,
	scanTransactions: async function(wallet) {
		const walrus = new WalrusClient(wallet.server_url),
			values = await Promise.all([
				walrus.getTransactions(500),
				walrus.getUnspentOutputs(),
				walrus.getBalance(true)
			]);

		wallet.transactions = values[0] || [];
		wallet.unspent_siacoin_outputs = values[1] || [];
		wallet.confirmed_siacoin_balance = values[2] || '0';

		await Store.dispatch('saveWallet', wallet);
	}
};