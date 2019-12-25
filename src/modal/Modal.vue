<template>
	<div class="page-modal">
		<button href="#" class="close-btn" @click="$emit('close')"><icon icon="times" /></button>
		<div class="modal-content">
			<slot></slot>
		</div>
	</div>
</template>

<script>
export default {

};
</script>

<style lang="stylus" scoped>
.page-modal {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 60px 15px;
	background: bg-dark-accent;
	overflow: hidden;
	z-index: 999;
}

.close-btn {
	display: inline-block;
	position: absolute;
	top: 10px;
	right: 10px;
	font-size: 2rem;
	color: rgba(255, 255, 255, 0.54);
	background: transparent;
	border: none;
	outline: none;
	box-shadow: none;
	transition: all 0.3s linear;

	&:hover, &:active {
		color: primary;
		cursor: pointer;
	}
}

.modal-content {
	max-width: 600px;
	margin: auto;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
}
</style>