import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import SeedPhraseInput from './SeedPhraseInput.vue';

const goldenWords = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ');

const mountOpts = (pushNotification = vi.fn()) => ({
	global: {
		stubs: { icon: true },
		mixins: [
			{
				methods: {
					translate(id, ...params) {
						return [id, ...params].join(':');
					},
					pushNotification(notification) {
						pushNotification(notification);
					}
				}
			}
		]
	}
});

describe('SeedPhraseInput', () => {
	it('renders one cell per word with sequential indices', () => {
		const wrapper = mount(SeedPhraseInput, {
			props: { count: 12 },
			...mountOpts()
		});

		expect(wrapper.findAll('.seed-phrase-cell')).toHaveLength(12);
		expect(wrapper.findAll('.seed-phrase-index').map(e => e.text())).toEqual(
			Array.from({ length: 12 }, (_, i) => String(i + 1))
		);
		expect(wrapper.findAll('.seed-phrase-cell').every(cell => cell.classes('control'))).toBe(true);
		expect(wrapper.findAllComponents({ name: 'WordInput' })[0].props('label')).toBe('createWalletModal.seedWord:1');
	});

	it('advances focus after selecting an autocomplete suggestion', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { count: 12 },
			attachTo: document.body,
			...mountOpts()
		});
		const inputs = wrapper.findAll('.word-input-field');

		await inputs[0].setValue('aban');
		await wrapper.find('.word-input-list li').trigger('mousedown');

		expect(document.activeElement).toBe(inputs[1].element);
		wrapper.unmount();
	});

	it('emits the joined phrase once every word is filled', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { count: 12 },
			...mountOpts()
		});

		const inputs = wrapper.findAllComponents({ name: 'WordInput' });
		goldenWords.forEach((w, i) => inputs[i].vm.$emit('input', w));

		const emitted = wrapper.emitted('input');

		await wrapper.vm.$nextTick();
		expect(emitted).toBeTruthy();
		expect(emitted[emitted.length - 1]).toEqual([goldenWords.join(' ')]);
	});

	it('does not emit a partial phrase when words are missing', () => {
		const wrapper = mount(SeedPhraseInput, {
			props: { count: 12 },
			...mountOpts()
		});

		const inputs = wrapper.findAllComponents({ name: 'WordInput' });
		inputs[0].vm.$emit('input', 'abandon');

		expect(wrapper.emitted('input')).toBeFalsy();
	});

	it('reports draft edits without committing them', () => {
		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords },
			...mountOpts()
		});

		wrapper.findAllComponents({ name: 'WordInput' })[0].vm.$emit('editing', 'ability');

		expect(wrapper.emitted('editing')[0]).toEqual([
			['ability', ...goldenWords.slice(1)].join(' ')
		]);
		expect(wrapper.vm.internal).toEqual(goldenWords);
	});

	it('preserves an invalid draft when a different word is committed', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords, expectedWords: goldenWords },
			...mountOpts()
		});
		const inputs = wrapper.findAll('.word-input-field');

		await inputs[0].setValue('zzzz');
		await inputs[1].setValue('abandon');
		await inputs[1].trigger('keydown', { key: 'Enter' });

		expect(wrapper.emitted('editing').at(-1)[0].split(' ')[0]).toBe('zzzz');
		expect(wrapper.emitted('input')).toBeFalsy();
		expect(inputs[0].attributes('aria-invalid')).toBe('true');
	});

	it('retains an incorrect pasted word in its own field for correction', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { expectedWords: goldenWords },
			...mountOpts()
		});
		const pastedWords = goldenWords.slice();
		pastedWords[4] = 'zzzz';
		const paste = new Event('paste', { bubbles: true, cancelable: true });

		Object.defineProperty(paste, 'clipboardData', {
			value: { getData: () => pastedWords.join(' ') }
		});
		wrapper.find('.word-input-field').element.dispatchEvent(paste);
		await wrapper.vm.$nextTick();

		expect(paste.defaultPrevented).toBe(true);
		expect(wrapper.findAll('.word-input-invalid')).toHaveLength(1);
		expect(wrapper.findAll('.word-input-field')[4].element.value).toBe('zzzz');
		expect(wrapper.emitted('input').at(-1)).toEqual([pastedWords.join(' ')]);
	});

	it('replaces an uncommitted draft when the original phrase is pasted again', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords, expectedWords: goldenWords },
			...mountOpts()
		});
		const input = wrapper.find('.word-input-field');

		await input.setValue('zzzz');
		const paste = new Event('paste', { bubbles: true, cancelable: true });

		Object.defineProperty(paste, 'clipboardData', {
			value: { getData: () => goldenWords.join(' ') }
		});
		input.element.dispatchEvent(paste);
		await wrapper.vm.$nextTick();

		expect(input.element.value).toBe('abandon');
		expect(input.attributes('aria-invalid')).toBe('false');
	});

	it('accepts a complete BIP-39 phrase pasted into any word field', async() => {
		const wrapper = mount(SeedPhraseInput, {
			props: { count: 12 },
			...mountOpts()
		});
		const paste = new Event('paste', { bubbles: true, cancelable: true });

		Object.defineProperty(paste, 'clipboardData', {
			value: { getData: () => goldenWords.join(' ') }
		});
		wrapper.find('.word-input-field').element.dispatchEvent(paste);
		await wrapper.vm.$nextTick();

		expect(paste.defaultPrevented).toBe(true);
		expect(wrapper.vm.internal).toEqual(goldenWords);
		expect(wrapper.emitted('input')[0]).toEqual([goldenWords.join(' ')]);
	});

	it('display mode is read-only and shows the provided words', () => {
		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords, readonly: true },
			...mountOpts()
		});

		expect(wrapper.findAllComponents({ name: 'WordInput' })).toHaveLength(12);
		expect(wrapper.findAllComponents({ name: 'WordInput' }).every(c => c.props('readonly'))).toBe(true);
	});

	it('copy writes the full phrase to the clipboard', async() => {
		const writeText = vi.fn();

		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});

		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords, readonly: true },
			...mountOpts()
		});

		await wrapper.find('button').trigger('click');
		await wrapper.vm.$nextTick();

		expect(writeText).toHaveBeenCalledWith(goldenWords.join(' '));
	});

	it('reports clipboard failures without exposing the phrase', async() => {
		const writeText = vi.fn().mockRejectedValue(new Error('denied')),
			pushNotification = vi.fn();

		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});

		const wrapper = mount(SeedPhraseInput, {
			props: { words: goldenWords, readonly: true },
			...mountOpts(pushNotification)
		});

		await wrapper.find('button').trigger('click');
		await wrapper.vm.$nextTick();

		expect(pushNotification).toHaveBeenCalledWith({
			severity: 'danger',
			message: 'createWalletModal.copySeedFailed'
		});
	});
});
