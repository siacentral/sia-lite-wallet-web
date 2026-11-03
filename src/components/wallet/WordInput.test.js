import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { webcrypto } from 'node:crypto';

import WordInput from './WordInput.vue';
import { prefixWords } from '@/sia/bip39';

function type(wrapper, text) {
	const input = wrapper.find('.word-input-field');

	input.element.value = text;
	input.trigger('input');

	return input;
}

describe('WordInput', () => {
	beforeEach(() => {
		vi.stubGlobal('crypto', webcrypto);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('does not open the full word list for an empty input', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		await wrapper.find('.word-input-field').trigger('focus');

		expect(wrapper.find('.word-input-list').exists()).toBe(false);
	});

	it('opens candidates that begin with the typed prefix', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 1 } });

		type(wrapper, 'ab');
		await wrapper.vm.$nextTick();

		const options = wrapper.findAll('.word-input-list li');
		const words = options.map(li => li.text());

		expect(words).toContain('abandon');
		expect(words).toContain('about');
		words.forEach(w => expect(w.startsWith('ab')).toBe(true));
	});

	it('keeps all matching suggestions available and opens upward when requested', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 12, dropUp: true } });

		type(wrapper, 'a');
		await wrapper.vm.$nextTick();

		expect(wrapper.findAll('.word-input-list li').map(option => option.text())).toEqual(prefixWords('a'));
		expect(wrapper.find('.word-input-list').classes()).toContain('word-input-list-up');
	});

	it('hides candidates that do not match the prefix', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		type(wrapper, 'zzzz');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.word-input-list').exists()).toBe(false);
	});

	it('scrolls to and selects a keyboard suggestion beyond the first five', async() => {
		const wrapper = mount(WordInput, { props: { index: 1 } });
		const input = wrapper.find('.word-input-field');

		await input.setValue('a');
		const list = wrapper.find('.word-input-list').element,
			option = list.children[5];

		Object.defineProperty(list, 'clientHeight', { value: 100 });
		Object.defineProperties(option, {
			offsetTop: { value: 100 },
			offsetHeight: { value: 20 }
		});
		for (let i = 0; i < 5; i++)
			await input.trigger('keydown', { key: 'ArrowDown' });

		expect(list.scrollTop).toBe(20);
		expect(input.attributes('aria-activedescendant')).toBe(option.id);
		await input.trigger('keydown', { key: 'Enter' });
		expect(wrapper.emitted('input')).toEqual([['absent']]);
	});

	it('commits a highlighted candidate on Enter', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		type(wrapper, 'abandon');
		await wrapper.vm.$nextTick();

		const input = wrapper.find('.word-input-field');
		input.trigger('keydown', { key: 'Enter' });

		await wrapper.vm.$nextTick();
		expect(wrapper.emitted('input')).toBeTruthy();
		expect(wrapper.emitted('input')[0]).toEqual(['abandon']);
	});

	it.each([
		['ab', 'ability', false],
		['ab', 'ability', true],
		['act', 'action', false]
	])('accepts the highlighted suggestion on Tab (prefix=%s, word=%s, shift=%s)', async(prefix, word, shiftKey) => {
		const wrapper = mount(WordInput, { props: { index: 1 } });
		const input = wrapper.find('.word-input-field');

		await input.setValue(prefix);
		await input.trigger('keydown', { key: 'ArrowDown' });
		const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });

		input.element.dispatchEvent(event);
		await wrapper.vm.$nextTick();
		expect(wrapper.emitted('input')).toEqual([[word]]);
		expect(wrapper.emitted('next')).toBeFalsy();
		expect(event.defaultPrevented).toBe(false);
		expect(wrapper.find('.word-input-list').exists()).toBe(false);
	});

	it('does not accept a dismissed suggestion on Tab', async() => {
		const wrapper = mount(WordInput, { props: { index: 1 } });
		const input = wrapper.find('.word-input-field');

		await input.setValue('ab');
		await input.trigger('keydown', { key: 'ArrowDown' });
		await input.trigger('keydown', { key: 'Escape' });
		await input.trigger('keydown', { key: 'Tab' });
		expect(wrapper.emitted('input')).toBeFalsy();
	});

	it('commits a clicked suggestion and requests the next input', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 1 } });

		type(wrapper, 'aban');
		await wrapper.vm.$nextTick();
		await wrapper.find('.word-input-list li').trigger('mousedown');

		expect(wrapper.emitted('input')[0]).toEqual(['abandon']);
		expect(wrapper.emitted('next')).toHaveLength(1);
		await wrapper.setProps({ value: 'abandon' });
		expect(wrapper.find('.word-input-field').classes()).toContain('word-input-complete');
	});

	it('commits an exact word on Space even when longer words share its prefix', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 1 } });

		type(wrapper, 'act');
		await wrapper.vm.$nextTick();
		await wrapper.find('.word-input-field').trigger('keydown', { key: ' ' });

		expect(wrapper.emitted('input')[0]).toEqual(['act']);
		expect(wrapper.emitted('next')).toHaveLength(1);
	});

	it('commits an exact word on blur even when longer words share its prefix', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 1 } });

		type(wrapper, 'act');
		await wrapper.vm.$nextTick();
		await wrapper.find('.word-input-field').trigger('blur');

		expect(wrapper.emitted('input')).toEqual([['act']]);
		expect(wrapper.emitted('next')).toBeFalsy();
	});

	it('re-commits the previous word when a cleared input loses focus', async() => {
		const wrapper = mount(WordInput, { props: { value: 'abandon', index: 1 } });

		type(wrapper, '');
		await wrapper.vm.$nextTick();
		await wrapper.find('.word-input-field').trigger('blur');

		expect(wrapper.vm.text).toBe('abandon');
		expect(wrapper.emitted('input')).toEqual([['abandon']]);
	});

	it('keeps an unmatched word visible and invalid when it loses focus', async() => {
		const wrapper = mount(WordInput, { props: { value: 'abandon', index: 1 } });

		type(wrapper, 'zzzz');
		await wrapper.vm.$nextTick();
		await wrapper.find('.word-input-field').trigger('blur');

		expect(wrapper.vm.text).toBe('zzzz');
		expect(wrapper.emitted('input')).toEqual([['zzzz']]);
		expect(wrapper.find('.word-input-field').attributes('aria-invalid')).toBe('true');
		expect(wrapper.find('.word-input-field').classes()).toContain('word-input-invalid');
	});

	it('marks a dictionary word incorrect for its confirmation position', async() => {
		const wrapper = mount(WordInput, {
			props: { value: 'ability', expectedWord: 'abandon', index: 1 }
		});
		const input = wrapper.find('.word-input-field');

		expect(input.classes()).toContain('word-input-invalid');
		expect(input.classes()).not.toContain('word-input-complete');
		expect(input.attributes('aria-invalid')).toBe('true');

		await input.setValue('aban');
		expect(input.attributes('aria-invalid')).toBe('false');
		await input.trigger('blur');
		await wrapper.setProps({ value: 'abandon' });
		expect(input.classes()).toContain('word-input-complete');
		expect(input.classes()).not.toContain('word-input-invalid');
	});

	it('does not mark empty or read-only fields invalid', async() => {
		const wrapper = mount(WordInput, { props: { expectedWord: 'about' } });

		expect(wrapper.find('.word-input-field').attributes('aria-invalid')).toBe('false');
		await wrapper.setProps({ value: 'abandon', readonly: true });
		expect(wrapper.find('.word-input-field').attributes('aria-invalid')).toBe('false');
		expect(wrapper.find('.word-input-field').classes()).not.toContain('word-input-complete');
	});

	it('filters suggestions by checksum without truncating the matches', async() => {
		const wrapper = mount(WordInput, {
			props: { index: 12, phrase: [...Array(11).fill('abandon'), ''], expectedWord: 'about' }
		});
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		await input.setValue('a');
		expect(wrapper.find('.word-input-list').exists()).toBe(false);
		await vi.waitFor(() => expect(wrapper.vm.checkedContext).not.toBeNull());

		const suggestions = wrapper.findAll('.word-input-list li').map(option => option.text());

		expect(suggestions).toEqual(wrapper.vm.checksumCandidates.filter(word => word.startsWith('a')));
		expect(suggestions.length).toBeGreaterThan(5);
		expect(suggestions).toContain('about');
		expect(suggestions).not.toContain('abandon');
		expect(suggestions).toContain('actual');
		await input.setValue('ab');
		await input.trigger('blur');
		expect(wrapper.emitted('input')).toEqual([['about']]);
	});

	it('discards checksum suggestions after another word is edited', async() => {
		const words = [...Array(11).fill('abandon'), ''];
		const wrapper = mount(WordInput, { props: { index: 12, phrase: words } });
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		await input.setValue('ab');
		await wrapper.setProps({ phrase: ['', ...words.slice(1)] });
		await flushPromises();

		expect(wrapper.vm.checkedContext).toBeNull();
		expect(wrapper.findAll('.word-input-list li').map(option => option.text())).toContain('abandon');
	});

	it('keeps a pending checksum dropdown dismissed after Escape', async() => {
		const wrapper = mount(WordInput, {
			props: { index: 12, phrase: [...Array(11).fill('abandon'), ''] }
		});
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		await input.setValue('ab');
		await input.trigger('keydown', { key: 'Escape' });
		await vi.waitFor(() => expect(wrapper.vm.checkedContext).not.toBeNull());

		expect(wrapper.find('.word-input-list').exists()).toBe(false);
	});

	it('reports checksum failures without displaying unfiltered suggestions or error details', async() => {
		vi.stubGlobal('crypto', { subtle: { digest: vi.fn().mockRejectedValue(new Error('hash failed')) } });
		const pushNotification = vi.fn();
		const wrapper = mount(WordInput, {
			props: { index: 12, phrase: [...Array(11).fill('abandon'), ''] },
			global: {
				mocks: {
					pushNotification,
					translate: key => key
				}
			}
		});
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		await input.setValue('ab');
		await flushPromises();

		expect(wrapper.find('.word-input-list').exists()).toBe(false);
		expect(pushNotification).toHaveBeenCalledWith({
			severity: 'danger',
			message: 'createWalletModal.seedSuggestionsFailed'
		});
	});

	it('does not re-commit an unchanged word on blur', async() => {
		const wrapper = mount(WordInput, { props: { value: 'act', index: 1 } });

		await wrapper.find('.word-input-field').trigger('focus');
		await wrapper.find('.word-input-field').trigger('blur');

		expect(wrapper.emitted('input')).toBeFalsy();
	});

	it('re-commits a normalized edit of the same word on blur', async() => {
		const wrapper = mount(WordInput, { props: { value: 'about', expectedWord: 'about', index: 12 } });
		const input = wrapper.find('.word-input-field');

		await input.setValue(' ABOUT ');
		await input.trigger('blur');

		expect(wrapper.vm.text).toBe('about');
		expect(wrapper.emitted('input')).toEqual([['about']]);
		expect(input.attributes('aria-invalid')).toBe('false');
	});

	it('disables browser text services on the input', () => {
		const attrs = mount(WordInput, { props: { value: '' } }).find('.word-input-field').attributes();

		expect(attrs.autocomplete).toBe('off');
		expect(attrs.autocorrect).toBe('off');
		expect(attrs.autocapitalize).toBe('off');
		expect(attrs.spellcheck).toBe('false');
	});

	it('does not report the popup as expanded when nothing matches', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 1 } });

		type(wrapper, 'zzzz');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.word-input-field').attributes('aria-expanded')).toBe('false');

		type(wrapper, 'ab');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.word-input-field').attributes('aria-expanded')).toBe('true');
	});

	it('does not auto-complete on Escape', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		const input = type(wrapper, 'ab');
		await wrapper.vm.$nextTick();

		input.trigger('keydown', { key: 'Escape' });
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('input')).toBeFalsy();
	});

	it.each(['', 'erase'])('suggests a matching word on initial entry and when editing (value=%s)', async(value) => {
		const wrapper = mount(WordInput, { props: { value, index: 11 } });
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		for (const prefix of ['e', 'er', 'erase']) {
			await input.setValue(prefix);
			expect(wrapper.findAll('.word-input-list li').map(option => option.text())).toContain('erase');
		}
	});

	it.each(['', 'thank'])('retains checksum-compatible suggestions at word 11 (value=%s)', async(value) => {
		const phrase = 'legal winner thank year wave sausage worth useful legal winner thank yellow'.split(' ');
		phrase[10] = value;
		const wrapper = mount(WordInput, { props: { value, index: 11, phrase } });
		const input = wrapper.find('.word-input-field');

		await input.trigger('focus');
		await input.setValue('th');
		await vi.waitFor(() => expect(wrapper.vm.checkedContext).not.toBeNull());
		expect(wrapper.findAll('.word-input-list li').map(option => option.text())).toContain('thank');
		await wrapper.findAll('.word-input-list li').find(option => option.text() === 'thank').trigger('mousedown');
		expect(wrapper.emitted('input')).toEqual([['thank']]);
	});

	it('synchronizes its autocomplete text when the committed value changes', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		await wrapper.setProps({ value: 'about' });
		await wrapper.find('.word-input-field').trigger('focus');

		expect(wrapper.vm.text).toBe('about');
		expect(wrapper.findAll('.word-input-list li').map(option => option.text())).toEqual(['about']);
	});
});
