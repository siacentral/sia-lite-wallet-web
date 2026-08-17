<template>
	<div class="word-input">
		<input
			ref="input"
			:class="{ 'word-input-complete': wordComplete }"
			class="word-input-field"
			v-model="text"
			:readonly="readonly"
			:aria-label="label"
			:aria-expanded="open"
			:aria-controls="listID"
			:aria-activedescendant="activeCandidateID"
			role="combobox"
			aria-autocomplete="list"
			autocomplete="off"
			@input="onInput"
			@focus="onFocus"
			@blur="onBlur"
			@keydown="onKey"
		>
		<ul
			v-if="open && candidates.length !== 0"
			:id="listID"
			:class="{ 'word-input-list-up': dropUp }"
			class="word-input-list"
			role="listbox"
		>
			<li
			v-for="(word, i) in candidates"
			:id="candidateID(i)"
			:key="word"
			:class="{ active: i === highlighted }"
			:aria-selected="i === highlighted"
			role="option"
			@mouseenter="highlighted = i"
			@mousedown.prevent="onSelect(word)"
		>{{ word }}</li>
		</ul>
	</div>
</template>

<script>
import { prefixWords, WORD_MAP } from '@/sia/bip39';

export default {
	props: {
		// the currently committed word
		value: {
			type: String,
			default: ''
		},
		// 1-based position shown to the user
		index: Number,
		label: String,
		readonly: Boolean,
		dropUp: Boolean
	},
	emits: ['editing', 'input', 'next'],
	data() {
		return {
			text: this.value,
			open: false,
			highlighted: 0
		};
	},
	computed: {
		wordComplete() {
			return !this.readonly && this.text === this.value && WORD_MAP.has(this.value);
		},
		exactWord() {
			const word = this.text.trim().toLowerCase();

			return WORD_MAP.has(word) ? word : null;
		},
		listID() {
			return `seed-word-options-${this.index}`;
		},
		activeCandidateID() {
			return this.open && this.candidates[this.highlighted] ? this.candidateID(this.highlighted) : undefined;
		},
		candidates() {
			if (this.text.trim() === '')
				return [];

			return prefixWords(this.text).filter(w => w !== this.value).slice(0, 5);
		}
	},
	watch: {
		value(value) {
			this.text = value;
		}
	},
	methods: {
		candidateID(index) {
			return `${this.listID}-${index}`;
		},
		onInput() {
			this.open = true;
			this.highlighted = 0;
			this.$emit('editing', this.text);
		},
		onFocus() {
			if (!this.readonly)
				this.open = this.candidates.length !== 0;
		},
		onBlur() {
			const prefix = this.text.trim().toLowerCase();

			this.open = false;
			if (prefix === '') {
				this.text = this.value;
				this.$emit('editing', this.value);
				return;
			}

			const matches = prefixWords(prefix);
			if (matches.length === 1)
				this.commit(matches[0]);
			else if (matches.length === 0) {
				this.text = this.value;
				this.$emit('editing', this.value);
			}
		},
		onKey(e) {
			if (this.readonly)
				return;

			if (this.candidates.length === 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))
				return;

			switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				this.highlighted = (this.highlighted + 1) % this.candidates.length;
				break;
			case 'ArrowUp':
				e.preventDefault();
				this.highlighted = (this.highlighted - 1 + this.candidates.length) % this.candidates.length;
				break;
			case 'Enter':
				e.preventDefault();
				if (this.exactWord)
					this.onSelect(this.exactWord, true);
				else if (this.candidates[this.highlighted])
					this.onSelect(this.candidates[this.highlighted], true);
				break;
			case ' ':
				if (this.exactWord || this.candidates.length === 1) {
					e.preventDefault();
					this.onSelect(this.exactWord || this.candidates[0], true);
				}
				break;
			case 'Tab':
				if (this.exactWord)
					this.commit(this.exactWord);
				break;
			case 'Escape':
				e.preventDefault();
				this.open = false;
				break;
			}
		},
		onSelect(word, advance = true) {
			this.commit(word);
			if (advance)
				this.$emit('next');
		},
		commit(word) {
			this.text = word;
			this.open = false;
			this.$emit('input', word);
		}
	}
};
</script>

<style lang="stylus" scoped>
.word-input {
	position: relative;
	min-width: 0;
}

.word-input-field {
	width: 100%;
}

.word-input-complete.word-input-complete {
	border-color: primary;
}

.word-input-list {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	right: 0;
	z-index: 100;
	margin: 0;
	padding: 0;
	overflow: hidden;
	list-style: none;
	text-align: left;
	font-family: inherit;
	font-size: 1rem;
	font-weight: 400;
	line-height: 1.2;
	color: rgba(0, 0, 0, 0.84);
	background: bg;
	border: 1px solid light-gray;
	border-radius: 4px;
	box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);

	li {
		padding: 9px 10px;
		cursor: pointer;
		white-space: nowrap;
		border-bottom: 1px solid light-gray;
		transition: color 0.15s linear, background-color 0.15s linear;

		&:last-child {
			border-bottom: none;
		}

		&:hover, &.active {
			color: primary-dark;
			background: primary-light;
		}
	}
}

.word-input-list-up {
	top: auto;
	bottom: calc(100% + 4px);
}

</style>

<style lang="stylus">
body.dark .word-input-list {
	color: rgba(255, 255, 255, 0.84);
	background: bg-dark-accent;
	border-color: dark-gray;

	li {
		border-color: dark-gray;

		&:hover, &.active {
			color: primary;
			background: rgba(25, 207, 134, 0.14);
		}
	}
}
</style>
