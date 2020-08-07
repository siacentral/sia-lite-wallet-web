import { decrypt, pbkdf2 } from '@/utils/crypto';

export async function unlockWallet(wallet, password) {
	const key = await pbkdf2(password, wallet.salt);

	return {
		...wallet,
		seed: decrypt(wallet.seed, key.hash)
	};
}