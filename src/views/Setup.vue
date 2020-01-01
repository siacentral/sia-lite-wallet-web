<template>
	<div class="page page-setup">
		<transition name="fade-top" mode="out-in" appear>

		</transition>
	</div>
</template>

<script>
export default {
	data() {
		return {
			step: null
		};
	}
};
</script>

<style lang="stylus" scoped>
.page-setup {
	position: fixed;
	background: bg-dark;
	z-index: 999;
}
</style>