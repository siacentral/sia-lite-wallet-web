<template>
	<div class="page-modal">
		<button href="#" class="close-btn" @click="$emit('close')"><icon icon="times" /></button>
		<div class="modal-content">
			<slot></slot>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.page-modal {
	position: fixed;
	display: grid;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	grid-gap: 15px;
	padding: 30px 15px;
	align-content: safe center;
	background: bg-dark-accent;
	overflow: hidden;
	z-index: 999;
}

h2 {
	margin: 0;
	padding: 15px;
	text-align: center;
	color: primary;
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
	height: 100%;
	width: 100%;
	max-width: 600px;
	margin: auto;
	overflow-x: hidden;
	overflow-y: auto;
}
</style>