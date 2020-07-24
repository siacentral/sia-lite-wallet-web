import { recoverAddresses, getTransactions } from '@/utils/sia';
import { saveAddresses, getWalletAddresses } from '@/store/db';
import Store from '@/store';
import Wallet from '@/types/wallet';

export default {
	quickScan: async function(wallet) {
		let startIndex = 0, lastKnownIndex, addressesPerRound = Store.state.addressesPerRound;
		const addresses = await getWalletAddresses(wallet.id);

		if (Array.isArray(addresses) && addresses.length !== 0) {
			lastKnownIndex = addresses[addresses.length - 1].index;

			if (lastKnownIndex > 5e4)
				startIndex = lastKnownIndex - 5e4;
		}

		if (typeof addressesPerRound !== 'number' || addressesPerRound <= 0 || addressesPerRound > 5000)
			addressesPerRound = 2500;

		await recoverAddresses(wallet.seed, startIndex, 2, addressesPerRound, lastKnownIndex, async(progress) => {
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
		let minScanRounds = Store.state.minScanRounds,
			addressesPerRound = Store.state.addressesPerRound;

		if (typeof minScanRounds !== 'number' || minScanRounds < 0 || minScanRounds > 500)
			minScanRounds = 25;

		if (typeof addressesPerRound !== 'number' || addressesPerRound <= 0 || addressesPerRound > 5000)
			addressesPerRound = 2500;

		await recoverAddresses(wallet.seed, 0, minScanRounds, addressesPerRound, 0, async(progress) => {
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

		const balance = await getTransactions(addresses.map(a => a.address));

		wallet = new Wallet({
			...wallet,
			...balance
		});

		await Store.dispatch('saveWallet', wallet);
	}
};