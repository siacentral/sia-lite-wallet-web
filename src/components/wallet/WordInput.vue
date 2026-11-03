<template>
	<div class="word-input">
		<input
			ref="input"
			:class="{ 'word-input-complete': wordComplete, 'word-input-invalid': wordInvalid }"
			class="word-input-field"
			v-model="text"
			:readonly="readonly"
			:aria-label="label"
			:aria-invalid="wordInvalid"
			:aria-expanded="open && candidates.length !== 0"
			:aria-controls="listID"
			:aria-activedescendant="activeCandidateID"
			role="combobox"
			aria-autocomplete="list"
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
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
import { checksumWords, prefixWords, WORD_MAP } from '@/sia/bip39';

export default {
	props: {
		// the currently committed word
		value: {
			type: String,
			default: ''
		},
		// 1-based position shown to the user
		index: Number,
		// Expected word at this position when confirming an existing seed.
		expectedWord: String,
		// Current phrase used to constrain suggestions by its BIP39 checksum.
		phrase: Array,
		label: String,
		readonly: Boolean,
		dropUp: Boolean
	},
	emits: ['editing', 'input', 'next'],
	data() {
		return {
			text: this.value,
			open: false,
			focused: false,
			highlighted: 0,
			checksumCandidates: [],
			checkedContext: null
		};
	},
	computed: {
		wordComplete() {
			return !this.readonly && !this.wordInvalid && this.text === this.value && WORD_MAP.has(this.value);
		},
		wordInvalid() {
			const word = this.text.trim().toLowerCase();

			if (this.readonly || word === '')
				return false;

			if (this.expectedWord !== undefined)
				return this.text === this.value ? word !== this.expectedWord : !this.expectedWord.startsWith(word);

			return this.text === this.value ? !WORD_MAP.has(word) : prefixWords(word).length === 0;
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
		draft() {
			return this.phrase?.[this.index - 1];
		},
		checksumContext() {
			if (!this.focused || this.readonly || this.phrase?.length !== 12)
				return null;

			const words = this.phrase.map((word, i) => i === this.index - 1 ? '' : word.trim().toLowerCase());

			if (words.some((word, i) => i !== this.index - 1 && !WORD_MAP.has(word)))
				return null;

			return words.join(' ');
		},
		matchingWords() {
			if (this.checksumContext !== null) {
				if (this.checkedContext !== this.checksumContext)
					return [];

				return this.checksumCandidates.filter(word => word.startsWith(this.text.trim().toLowerCase()));
			}

			return prefixWords(this.text);
		},
		candidates() {
			if (this.text.trim() === '')
				return [];

			return this.matchingWords.filter(w => w !== this.value).slice(0, 5);
		}
	},
	watch: {
		value(value) {
			this.text = value;
		},
		draft(value) {
			if (value !== undefined)
				this.text = value;
		},
		checksumContext(context) {
			this.updateChecksumCandidates(context);
		}
	},
	beforeUnmount() {
		this.focused = false;
	},
	methods: {
		async updateChecksumCandidates(context) {
			this.checksumCandidates = [];
			this.checkedContext = null;
			this.highlighted = 0;

			if (context === null)
				return;

			try {
				const candidates = await checksumWords(context.split(' '), this.index - 1);

				if (this.checksumContext !== context)
					return;

				this.checksumCandidates = candidates;
				this.checkedContext = context;
			} catch {
				if (this.checksumContext !== context)
					return;

				this.open = false;
				this.pushNotification({
					severity: 'danger',
					message: this.translate('createWalletModal.seedSuggestionsFailed')
				});
			}
		},
		candidateID(index) {
			return `${this.listID}-${index}`;
		},
		onInput() {
			this.open = true;
			this.highlighted = 0;
			this.$emit('editing', this.text);
		},
		onFocus() {
			if (!this.readonly) {
				this.focused = true;
				this.open = true;
			}
		},
		onBlur() {
			const prefix = this.text.trim().toLowerCase(),
				matches = this.matchingWords;

			this.open = false;
			this.focused = false;
			if (prefix === '') {
				this.restore();
				return;
			}

			if (this.text === this.value)
				return;

			if (this.exactWord) {
				this.commit(this.exactWord);
				return;
			}

			if (matches.length === 1)
				this.commit(matches[0]);
			else
				this.commit(prefix);
		},
		// re-commits the previous word so the parent revalidates the full phrase
		restore() {
			if (this.value === '') {
				this.text = '';
				this.$emit('editing', '');
				return;
			}

			this.commit(this.value);
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

.word-input-invalid.word-input-invalid {
	border-color: negative-accent;
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
