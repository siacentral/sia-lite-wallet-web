<template>
	<div id="app">
		<div class="titlebar"></div>
		<primary-nav />
		<div class="page-wrapper">
			<transition name="fade" mode="out-in" appear>
				<router-view v-if="loaded" />
			</transition>
		</div>
	</div>
</template>

<script>
import { mapActions } from 'vuex';
import PrimaryNav from '@/components/PrimaryNav';

export default {
	components: {
		PrimaryNav
	},
	data() {
		return {
			loaded: false
		};
	},
	async beforeMount() {
		try {
			await this.unlockWallets('password');

			this.loaded = true;
		} catch (ex) {
			console.error(ex);
		}
	},
	methods: {
		...mapActions(['unlockWallets'])
	}
};
</script>

<style lang="stylus">
@require "./styles/global";

.titlebar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 20px;
	-webkit-user-select: none;
	-webkit-app-region: drag;
	z-index: 1000;

	button {
		display: none;
	}
}

#app {
	width: 100%;
	height: 100%;

	@media screen and (min-width: 767px) {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
	}
}

.page-wrapper {
	position: relative;
	width: 100%;
	height: 100%;
}

body.linux {
	.titlebar {
		display: none;
	}
}

body.win32 {
	.titlebar {
		height: 32px;

		button {
			display: inline-block;
			width: 46px;
			height: 32px;
			text-align: center;
			border: none;
			outline: none;
			background: none;
			font-family: "Segoe MDL2 Assets";
			font-size: 10px;
			color: rgba(255, 255, 255, 0.84);
			cursor: pointer;
			float: right;
			-webkit-app-region: none;

			&:hover, &:active, &:focus {
				color: primary;
			}
		}
	}
}
</style>
