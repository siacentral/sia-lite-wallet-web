import { describe, expect, it, vi } from 'vitest';

vi.mock('@/sia', () => ({
	generateAddresses: vi.fn(),
	generateSeed: vi.fn()
}));

import BuildWallet from './BuildWallet.vue';
import { generateAddresses } from '@/sia';

const bip39Phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const siaPhrase = 'rodent colony illness junk waist leopard pierce oust wield viewpoint slackens axis jittery vampire rockets cistern eels oaks cell emotion eagle vortex pests cedar business cactus inorganic cocoa';

function importContext(seedInput) {
	return {
		$nextTick: vi.fn().mockResolvedValue(),
		$refs: seedInput ? { seedInput } : {},
		importSeed: true,
		recoverySeed: '',
		seedType: 'walrus'
	};
}

describe('BuildWallet seed import', () => {
	it('loads a 12-word BIP-39 phrase into the word inputs', async() => {
		const seedInput = { setPhrase: vi.fn() },
			context = importContext(seedInput);

		await BuildWallet.methods.onImportSeed.call(context, bip39Phrase);

		expect(context.seedType).toBe('walrus');
		expect(context.recoverySeed).toBe(bip39Phrase);
		expect(seedInput.setPhrase).toHaveBeenCalledWith(bip39Phrase);
		expect(context.importSeed).toBe(false);
	});

	it('preserves legacy Sia phrase recovery through the textarea mode', async() => {
		const context = importContext();

		await BuildWallet.methods.onImportSeed.call(context, siaPhrase);

		expect(context.seedType).toBe('sia');
		expect(context.recoverySeed).toBe(siaPhrase);
		expect(context.importSeed).toBe(false);
	});

	it('normalizes recovery phrase whitespace before validation and storage', async() => {
		const recoverySeed = siaPhrase.replace('illness junk', 'illness  \n\tjunk'),
			context = {
				createType: 'recover',
				recoverySeed
			};

		generateAddresses.mockResolvedValue([{ address: 'wallet-address' }]);

		const seed = await BuildWallet.methods.generateWalletSeed.call(context);

		expect(seed).toBe(siaPhrase);
		expect(generateAddresses).toHaveBeenCalledWith(siaPhrase, 0, 1);
	});
});
