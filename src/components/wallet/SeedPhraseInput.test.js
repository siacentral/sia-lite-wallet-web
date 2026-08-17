import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import SeedPhraseInput from './SeedPhraseInput.vue';

const goldenWords = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(' ');

const mountOpts = () => ({
	global: {
		stubs: { icon: true },
		mixins: [
			{
				methods: {
					translate(id) {
						return id;
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
});
