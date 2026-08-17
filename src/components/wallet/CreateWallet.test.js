import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/sia', () => ({
	generateAddresses: vi.fn()
}));

import CreateWallet from './CreateWallet.vue';
import { generateAddresses } from '@/sia';

const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

function confirmationContext() {
	return {
		addresses: [{ address: 'wallet-address' }],
		confirmError: null,
		confirmPhrase: '',
		confirmValid: false,
		confirmValidating: false,
		seedWordCount: 12
	};
}

describe('CreateWallet seed confirmation', () => {
	beforeEach(() => {
		generateAddresses.mockReset();
	});

	it('accepts the phrase that derives the wallet address', async() => {
		generateAddresses.mockResolvedValue([{ address: 'wallet-address' }]);
		const context = confirmationContext();

		await CreateWallet.methods.onConfirmInput.call(context, phrase);

		expect(context.confirmValid).toBe(true);
		expect(context.confirmError).toBeNull();
	});

	it('rejects a valid phrase that derives a different wallet address', async() => {
		generateAddresses.mockResolvedValue([{ address: 'different-address' }]);
		const context = confirmationContext();

		await CreateWallet.methods.onConfirmInput.call(context, phrase);

		expect(context.confirmValid).toBe(false);
		expect(context.confirmError).toBe('mismatch');
	});

	it('rejects a phrase that fails seed validation', async() => {
		generateAddresses.mockRejectedValue(new Error('invalid seed'));
		const context = confirmationContext();

		await CreateWallet.methods.onConfirmInput.call(context, phrase);

		expect(context.confirmValid).toBe(false);
		expect(context.confirmError).toBe('invalid');
	});

	it('invalidates confirmation as soon as a confirmed word is edited', () => {
		const context = confirmationContext();

		context.confirmValid = true;
		context.confirmValidating = true;
		CreateWallet.methods.onConfirmEditing.call(context, 'ability');

		expect(context.confirmPhrase).toBe('ability');
		expect(context.confirmValid).toBe(false);
		expect(context.confirmValidating).toBe(false);
	});

	it('reports progress using committed BIP-39 words', () => {
		const count = CreateWallet.computed.confirmWordCount.call({
			confirmPhrase: 'abandon ability aban',
			seedWordCount: 12
		});

		expect(count).toBe(2);
	});

	it('keeps a new wallet in memory until its seed is confirmed', async() => {
		const addresses = [{ address: 'wallet-address' }],
			saveWallet = vi.fn(),
			context = {
				addresses: [],
				confirmError: null,
				confirmPhrase: '',
				confirmValid: false,
				exported: false,
				pushNotification: vi.fn(),
				saveWallet,
				step: 'create',
				wallet: null
			};

		generateAddresses.mockResolvedValue(addresses);
		await CreateWallet.methods.onWalletCreated.call(context, {
			seed: phrase,
			type: 'default'
		});

		expect(context.step).toBe('reveal');
		expect(context.addresses).toEqual(addresses);
		expect(saveWallet).not.toHaveBeenCalled();
	});

	it('persists a default wallet only after successful confirmation', async() => {
		const saveWallet = vi.fn().mockResolvedValue(true),
			emit = vi.fn(),
			context = {
				$emit: emit,
				confirmValid: false,
				saveWallet,
				saving: false,
				wallet: { seed: phrase, type: 'default' },
				walletType: 'default'
			};

		await CreateWallet.methods.onComplete.call(context);
		expect(saveWallet).not.toHaveBeenCalled();
		expect(emit).not.toHaveBeenCalled();

		context.confirmValid = true;
		await CreateWallet.methods.onComplete.call(context);
		expect(saveWallet).toHaveBeenCalledOnce();
		expect(emit).toHaveBeenCalledWith('created', context.wallet);
	});
});
