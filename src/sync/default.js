import { recoverAddresses } from '@/utils/sia';
import { saveAddresses, getWalletAddresses } from '@/store/db';
import Store from '@/store';

export default {
	quickScan: async function(wallet) {
		const addresses = await getWalletAddresses(wallet.id);
		let lastUsed = 0, startIndex = 0,
			addressesPerRound = Store.state.addressesPerRound;

		if (Array.isArray(addresses) && addresses.length !== 0) {
			lastUsed = addresses[addresses.length - 1].index;

			if (lastUsed > 3e4)
				startIndex = lastUsed - 3e4;
		}

		if (typeof addressesPerRound !== 'number' || isNaN(addressesPerRound) || !isFinite(addressesPerRound))
			addressesPerRound = 1000;

		await recoverAddresses(wallet.seed, startIndex, 2, addressesPerRound, async(progress) => {
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

		if (typeof minScanRounds !== 'number' || isNaN(minScanRounds) || !isFinite(minScanRounds))
			minScanRounds = 100;

		if (typeof addressesPerRound !== 'number' || isNaN(addressesPerRound) || !isFinite(addressesPerRound))
			addressesPerRound = 1000;

		await recoverAddresses(wallet.seed, 0, minScanRounds, addressesPerRound, async(progress) => {
			if (!progress || !Array.isArray(progress.addresses))
				return;

			await saveAddresses(progress.addresses.map(a => ({
				...a,
				wallet_id: wallet.id
			})));
		});
	}
};