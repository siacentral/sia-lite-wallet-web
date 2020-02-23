import WalrusClient from '@/api/walrus';
// import { saveAddresses, getWalletAddresses } from '@/store/db';
// import Store from '@/store';

async function scan(wallet) {
	const walrus = new WalrusClient(wallet.server_url),
		addresses = await walrus.getAddresses(),
		ucPromises = [];

	for (let i = 0; i < addresses.length; i++)
		ucPromises.push(walrus.getAdressUnlockConditions(addresses[i]));

	console.log(await Promise.all(ucPromises));
}

export default {
	quickScan: scan,
	fullScan: scan,
	scanTransactions: async function(wallet) {

	}
};