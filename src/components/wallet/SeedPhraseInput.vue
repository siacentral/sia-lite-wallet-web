<template>
	<div class="seed-phrase-input" @paste="onPaste">
		<div class="seed-phrase-grid">
			<div v-for="i in count" :key="i" class="seed-phrase-cell control">
				<span class="seed-phrase-index">{{ i }}</span>
				<word-input
					:value="internal[i - 1]"
					:index="i"
					:readonly="readonly"
					:drop-up="i > count - 4"
					:label="`word ${i}`"
					@editing="onEditing(i - 1, $event)"
					@input="onWord(i - 1, $event)"
					@next="focusNext(i - 1)"
				/>
			</div>
		</div>
		<button v-if="readonly && words" type="button" class="btn btn-inline" :title="translate('createWalletModal.copy')" @click="copy">
			<icon icon="copy" />
			{{ translate('createWalletModal.copy') }}
		</button>
	</div>
</template>

<script>
import WordInput from '@/components/wallet/WordInput';
import { WORD_MAP } from '@/sia/bip39';

export default {
	components: {
		WordInput
	},
	emits: ['editing', 'input'],
	props: {
		words: Array,
		count: {
			type: Number,
			default: 12
		},
		readonly: Boolean
	},
	data() {
		return {
			internal: this.normalize(this.words)
		};
	},
	watch: {
		words(v) {
			this.internal = this.normalize(v);
		}
	},
	methods: {
		normalize(words) {
			const base = words ? words.slice() : new Array(this.count);

			for (let i = 0; i < this.count; i++) {
				if (base[i] === undefined || base[i] === null)
					base[i] = '';
			}

			return base.slice(0, this.count);
		},
		onEditing(index, word) {
			const draft = this.internal.slice();

			draft[index] = word;
			this.$emit('editing', draft.join(' '));
		},
		onWord(index, word) {
			this.internal[index] = word;
			this.$emit('editing', this.internal.join(' '));

			if (this.internal.every(w => w !== ''))
				this.$emit('input', this.internal.join(' '));
		},
		focusNext(index) {
			const inputs = this.$el.querySelectorAll('.word-input-field');

			if (inputs[index + 1])
				inputs[index + 1].focus();
		},
		onPaste(event) {
			if (this.readonly)
				return;

			const phrase = event.clipboardData?.getData('text').trim().toLowerCase(),
				words = phrase ? phrase.split(/\s+/) : [];

			if (words.length !== this.count || !words.every(word => WORD_MAP.has(word)))
				return;

			event.preventDefault();
			this.internal = words;
			this.$emit('editing', phrase);
			this.$emit('input', phrase);
		},
		async copy() {
			await navigator.clipboard.writeText(this.internal.join(' '));
		},
		setPhrase(phrase) {
			const words = phrase.split(' ');

			for (let i = 0; i < this.count; i++)
				this.internal[i] = words[i] ?? '';
		}
	}
};
</script>

<style lang="stylus" scoped>
.seed-phrase-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	grid-gap: 10px;

	@media screen and (min-width: 600px) {
		grid-template-columns: repeat(4, 1fr);
	}
}

.seed-phrase-cell.control {
	display: grid;
	grid-template-columns: 1.5rem 1fr;
	align-items: center;
	min-width: 0;
	margin-bottom: 0;
}

.seed-phrase-index {
	color: rgba(255, 255, 255, 0.54);
}

.seed-phrase-input > .btn {
	margin-top: 15px;
	margin-right: 0;
	padding: 10px 18px;
}
</style>
