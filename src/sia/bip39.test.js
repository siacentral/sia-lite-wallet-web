import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';

import { WORDS, WORD_MAP, prefixWords, checksumWords } from '@/sia/bip39';

describe('bip39 wordlist', () => {
	it('has 2048 unique words', () => {
		expect(WORDS.length).toBe(2048);
		expect(new Set(WORDS).size).toBe(2048);
	});

	it('matches the canonical ordered BIP-39 English wordlist', () => {
		const checksum = createHash('sha256')
			.update(`${WORDS.join('\n')}\n`)
			.digest('hex');

		expect(checksum).toBe('2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda');
	});

	it('WORD_MAP is a bijection over WORDS', () => {
		WORDS.forEach((word, i) => expect(WORD_MAP.get(word)).toBe(i));
		expect(WORD_MAP.size).toBe(2048);
	});

	it('prefixWords returns list-order candidates that begin with the prefix', () => {
		const candidates = prefixWords('ab');

		expect(candidates).toContain('abandon');
		expect(candidates).toContain('about');
		expect(candidates.every(w => w.startsWith('ab'))).toBe(true);
	});

	it('prefixWords is empty for a non-matching prefix', () => {
		expect(prefixWords('zzzz')).toEqual([]);
	});
});

describe('bip39 checksum suggestions', () => {
	const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ');

	beforeEach(() => {
		vi.stubGlobal('crypto', webcrypto);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function validChecksum(words) {
		const bits = words.map(word => WORD_MAP.get(word).toString(2).padStart(11, '0')).join(''),
			entropy = Buffer.from(bits.slice(0, 128).match(/.{8}/g).map(byte => parseInt(byte, 2))),
			digest = createHash('sha256').update(entropy).digest();

		return digest[0] >> 4 === parseInt(bits.slice(128), 2);
	}

	it.each([
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
		'legal winner thank year wave sausage worth useful legal winner thank yellow',
		'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
		'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
	])('includes the final word of published BIP39 vector %#', async(vector) => {
		const words = vector.split(' '),
			matches = await checksumWords([...words.slice(0, 11), ''], 11);

		expect(matches).toHaveLength(128);
		expect(matches).toContain(words[11]);
		expect(matches.every(word => validChecksum([...words.slice(0, 11), word]))).toBe(true);
	});

	it.each([0, 5, 10, 11])('returns every checksum-compatible replacement at position %i', async(index) => {
		const words = phrase.slice(),
			expected = WORDS.filter(word => validChecksum(phrase.map((original, i) => i === index ? word : original)));

		words[index] = 'not-a-word';
		expect(await checksumWords(words, index)).toEqual(expected);
		expect(words[index]).toBe('not-a-word');
	});

	it('excludes a dictionary word with an invalid checksum', async() => {
		const matches = await checksumWords(phrase, 11);

		expect(matches).toContain('about');
		expect(matches).not.toContain('abandon');
	});

	it('does not restrict suggestions while another word is missing or malformed', async() => {
		for (const invalid of ['', 'aban', 'not-a-word', null, undefined]) {
			const words = phrase.slice();

			words[3] = invalid;
			expect(await checksumWords(words, 11)).toBeUndefined();
		}
	});

	it('does not apply the 12-word checksum to unsupported input', async() => {
		expect(await checksumWords([], 0)).toBeUndefined();
		expect(await checksumWords(new Array(12), 11)).toBeUndefined();
		expect(await checksumWords(null, 0)).toBeUndefined();
		expect(await checksumWords(phrase, -1)).toBeUndefined();
		expect(await checksumWords(phrase, 12)).toBeUndefined();
	});

	it('propagates hashing failures and clears the entropy buffer', async() => {
		const digest = vi.fn().mockRejectedValue(new Error('digest unavailable'));

		vi.stubGlobal('crypto', { subtle: { digest } });
		await expect(checksumWords(new Array(12).fill('zoo'), 11)).rejects.toThrow('digest unavailable');
		expect([...digest.mock.calls[0][1]]).toEqual(new Array(16).fill(0));
	});
});
