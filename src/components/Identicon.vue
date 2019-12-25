<template>
	<svg viewBox="0 0 5 5" class="identicon">
		<g>
			<rect width="5" height="5" x="0" y="0" :fill="background" />
			<rect v-for="(cell, i) in cells" :key="i" width="1" height="1" :x="cell[0]" :y="cell[1]" :fill="foreground" shape-rendering="crispEdges" />
		</g>
	</svg>
</template>

<script>
import { hash } from 'tweetnacl';
import { encode as encodeUTF8 } from '@stablelib/utf8';

export default {
	props: {
		value: String
	},
	data() {
		return {
			hash: hash(encodeUTF8(''))
		};
	},
	mounted() {
		this.hash = hash(encodeUTF8(this.value));
	},
	computed: {
		hue() {
			return (this.hash[60] + this.hash[61] + this.hash[62] + this.hash[63]) % 360;
		},
		foreground() {
			return `hsl(${this.hue}, 70%, 40%)`;
		},
		background() {
			return `hsl(${(this.hue + 240) % 360}, 70%, 40%)`;
		},
		cells() {
			const cells = [],
				size = 5,
				c = Math.ceil(size / 2);

			for (let i = 0; i < 15; i++) {
				const x = Math.floor(i / size),
					y = i % size,
					mx = size - x - 1,
					pos = x + y * c;

				if ((this.hash[Math.floor(pos / 8)] & (1 << (7 - pos % 8))) !== 0)
					cells.push([x, y], [mx, y]);
			}

			return cells;
		}
	},
	watch: {
		value(val) {
			this.hash = hash(encodeUTF8(val));
		}
	}
};
</script>

<style lang="stylus" scoped>

</style>