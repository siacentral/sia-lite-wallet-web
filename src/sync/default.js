import { recoverAddresses } from '@/utils/sia';
import { saveAddresses, getWalletAddresses } from '@/store/db';

export default {
	quickScan: async function(wallet) {
		const addresses = await getWalletAddresses(wallet.id);
		let lastUsed = 0, startIndex = 0;

		if (Array.isArray(addresses) && addresses.length !== 0) {
			lastUsed = addresses[addresses.length - 1].index;

			if (lastUsed > 3e4)
				startIndex = lastUsed - 3e4;
		}

		await recoverAddresses(wallet.seed, startIndex, 2, async(progress) => {
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
		await recoverAddresses(wallet.seed, 0, 100, async(progress) => {
			if (!progress || !Array.isArray(progress.addresses))
				return;

			await saveAddresses(progress.addresses.map(a => ({
				...a,
				wallet_id: wallet.id
			})));
		});
	}
};