import WalrusClient from '@/api/walrus';
import { saveAddresses } from '@/store/db';
// import Store from '@/store';

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

	}
};