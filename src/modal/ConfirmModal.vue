<template>
	<modal @close="$emit('close')">
		<div class="confirm-content">
			<h2 class="text-center">{{ title }}</h2>
			<slot />
			<div class="buttons">
				<button
					v-for="(button, i) in buttons" :key="i"
					:class="buttonClasses(button)"
					@click="$emit('selected', button.key)">{{ translate(button.key) }}</button>
			</div>
		</div>
	</modal>
</template>

<script>
import Modal from './Modal';

export default {
	components: {
		Modal
	},
	props: {
		title: String,
		buttons: Array
	},
	methods: {
		buttonClasses(button) {
			const classes = {
				btn: true,
				'btn-inline': true
			};

			if (button.type)
				classes[`btn-${button.type}`] = true;

			return classes;
		}
	}
};
</script>

<style lang="stylus" scoped>
.confirm-content {
	display: grid;
	align-content: safe center;
	grid-gap: 15px;
	height: 100%;
}
</style>