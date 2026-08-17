import { describe, expect, it, vi } from 'vitest';

import BuildWallet from './BuildWallet.vue';

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
});
