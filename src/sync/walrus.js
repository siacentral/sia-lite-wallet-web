import WalrusClient from '@/api/walrus';
import { getBlock } from '@/api/siacentral';
import { saveAddresses, getWalletAddresses } from '@/store/db';
import Store from '@/store';
import BigNumber from 'bignumber.js';

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
			blockHeight = (await getBlock()).height,
			addresses = await getWalletAddresses(wallet.id),
			addressMap = addresses.reduce((v, a) => {
				v[a] = true;

				return v;
			}, {}),
			values = await Promise.all([
				walrus.getTransactions(500),
				walrus.getLimboTransactions(),
				walrus.getUnspentOutputs(),
				walrus.getBalance(true)
			]);

		wallet.transactions = values[0].map(txn => ({
			...txn,
			confirmations: 1 + blockHeight - txn.blockHeight
		}));
		wallet.unspent_siacoin_outputs = values[2] || [];
		wallet.confirmed_siacoin_balance = values[3] || '0';

		console.log(values[1]);

		wallet.transactions.unshift(...values[1].map(txn => {
			let sent = new BigNumber(0);

			txn.miner_fees.forEach(m => {
				sent = sent.plus(m);
			});

			txn.siacoin_outputs = txn.siacoin_outputs.map(o => {
				if (addressMap[o.unlock_hash])
					o.owned = true;
				else
					sent = sent.plus(o.value);

				return o;
			});

			txn.siacoin_value = {
				direction: 'sent',
				value: sent
			};

			return txn;
		}));

		await Store.dispatch('saveWallet', wallet);
	}
};