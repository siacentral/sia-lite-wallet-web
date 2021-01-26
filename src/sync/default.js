import { recoverAddresses, getTransactions } from '@/sia';
import { saveAddresses, getWalletAddresses } from '@/store/db';
import Store from '@/store';
import Wallet from '@/types/wallet';

export default {
	quickScan: async function(wallet) {
		let startIndex = 0, lastKnownIndex,
			maxLookahead = Store.state.addressLookahead;
		const addresses = await getWalletAddresses(wallet.id);

		if (typeof maxLookahead !== 'number' || maxLookahead < 0 || maxLookahead > 500000)
			maxLookahead = 25000;

		if (Array.isArray(addresses) && addresses.length !== 0) {
			lastKnownIndex = addresses[addresses.length - 1].index;

			if (lastKnownIndex > maxLookahead)
				startIndex = lastKnownIndex - maxLookahead;
		}

		await recoverAddresses(wallet.seed, wallet.currency, startIndex, maxLookahead, lastKnownIndex, async(progress) => {
			if (!progress || !Array.isArray(progress.addresses))
				return;

			await saveAddresses(progress.addresses.map((a, i) => {
				return {
					...a,
					wallet_id: wallet.id
				};
			}));
		});
	},
	fullScan: async function(wallet) {
		let maxLookahead = Store.state.addressLookahead;

		if (typeof maxLookahead !== 'number' || maxLookahead < 0 || maxLookahead > 500000)
			maxLookahead = 25000;

		await recoverAddresses(wallet.seed, wallet.currency, 0, maxLookahead, 0, async(progress) => {
			if (!progress || !Array.isArray(progress.addresses))
				return;

			await saveAddresses(progress.addresses.map(a => ({
				...a,
				wallet_id: wallet.id
			})));
		});
	},
	scanTransactions: async function(wallet) {
		const addresses = await getWalletAddresses(wallet.id);

		if (!Array.isArray(addresses) || addresses.length === 0)
			throw new Error('wallet has no addresses');

		const balance = await getTransactions(addresses.map(a => a.address), wallet.currency);

		wallet = new Wallet({
			...wallet,
			...balance
		});

		await Store.dispatch('saveWallet', wallet);
	}
};