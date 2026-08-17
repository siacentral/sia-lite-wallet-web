import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import WordInput from './WordInput.vue';
import { prefixWords } from '@/sia/bip39';

function type(wrapper, text) {
	const input = wrapper.find('.word-input-field');

	input.element.value = text;
	input.trigger('input');

	return input;
}

describe('WordInput', () => {
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

	it('keeps the suggestion menu short and opens upward when requested', async() => {
		const wrapper = mount(WordInput, { props: { value: '', index: 12, dropUp: true } });

		type(wrapper, 'a');
		await wrapper.vm.$nextTick();

		expect(wrapper.findAll('.word-input-list li')).toHaveLength(5);
		expect(wrapper.find('.word-input-list').classes()).toContain('word-input-list-up');
	});

	it('hides candidates that do not match the prefix', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		type(wrapper, 'zzzz');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('.word-input-list').exists()).toBe(false);
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

	it('does not auto-complete on Escape', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		const input = type(wrapper, 'ab');
		await wrapper.vm.$nextTick();

		input.trigger('keydown', { key: 'Escape' });
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('input')).toBeFalsy();
	});

	it('excludes the already-committed word from candidates', () => {
		const candidates = prefixWords('abandon').filter(w => w !== 'abandon');

		expect(candidates).not.toContain('abandon');
	});

	it('synchronizes its autocomplete text when the committed value changes', async() => {
		const wrapper = mount(WordInput, { props: { value: '' } });

		await wrapper.setProps({ value: 'about' });
		await wrapper.find('.word-input-field').trigger('focus');

		expect(wrapper.vm.text).toBe('about');
		expect(wrapper.find('.word-input-list').exists()).toBe(false);
	});
});
