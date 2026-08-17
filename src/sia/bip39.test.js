import { describe, it, expect } from 'vitest';

import { WORDS, WORD_MAP, prefixWords } from '@/sia/bip39';

describe('bip39 wordlist', () => {
	it('has 2048 unique words', () => {
		expect(WORDS.length).toBe(2048);
		expect(new Set(WORDS).size).toBe(2048);
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
