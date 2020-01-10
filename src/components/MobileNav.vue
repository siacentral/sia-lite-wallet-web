<template>
	<div class="mobile-nav-wrapper">
		<nav class="mobile-nav">
			<div class="nav-section"><button :class="{ 'hamburger-btn': true, 'menu-active': menuActive }" @click="menuActive = !menuActive"><span /><span /><span /><span /><span /></button></div>
			<div class="nav-section"><sia-central /></div>
			<div class="nav-section"><slot /></div>
		</nav>
		<transition name="slide-left" appear>
			<div class="mobile-menu" v-if="menuActive">
				<div class="upper">
					<router-link :to="{ name: 'wallets' }" class="menu-item">
						<icon icon="wallet" /> {{ translate('menu.wallets') }}
					</router-link>
				</div>
				<div class="lower">
					<router-link :to="{ name: 'settings' }" class="menu-item">
						<icon icon="cogs" /> {{ translate('menu.settings') }}
					</router-link>
				</div>
			</div>
		</transition>
		<div class="menu-cover" @click.self.stop="menuActive = false" v-if="menuActive"></div>
	</div>
</template>

<script>
import SiaCentral from '@/assets/siacentral.svg';

export default {
	components: {
		SiaCentral
	},
	data() {
		return {
			menuActive: false
		};
	}
};
</script>

<style lang="stylus" scoped>
.mobile-nav-wrapper {
	position: fixed;
	display: block;
	z-index: 999;

	@media screen and (min-width: 767px) {
		display: none;
	}
}

.mobile-nav {
	position: fixed;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
	top: 0;
	left: 0;
	right: 0;
	height: 60px;
	grid-gap: 5px;
	background: bg-dark-accent;
	box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	align-items: center;
	z-index: 998;

	.nav-section:first-child {
		padding-left: 8px;
		text-align: left;
	}

	.nav-section:last-child {
		padding-right: 8px;
		text-align: right;
	}

	svg {
		display: block;
		height: 48px;
		width: auto;
		margin: auto;
	}
}

.slide-left-enter-active {
	transition: transform .5s ease, opacity .5s ease;
}

.slide-left-leave-active {
	transition: transform .5s ease, opacity .5s ease;
}

.slide-left-enter, .slide-left-leave-to {
	transform: translateX(-100%);
	opacity: 0;
}

.mobile-menu {
	position: fixed;
	display: grid;
	top: 60px;
	left: 0;
	bottom: 0;
	min-width: 225px;
	grid-template-rows: repeat(2, auto);
	align-content: space-between;
	background: bg-dark-accent;
	box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.22);
	z-index: 999;

	.upper, .lower {
		width: 100%;
	}

	a.menu-item {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		grid-gap: 15px;
		padding: 20px 30px;
		align-items: center;
		text-align: left;
		color: rgba(255, 255, 255, 0.54);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s linear;

		&:hover, &:focus, &:active, &.router-link-exact-active {
			color: primary;
			text-decoration: none;
		}

		svg {
			width: 1.5rem;
			height: auto;
			margin: auto;
		}

		&:last-child {
			margin-bottom: 0;
		}
	}
}

.menu-cover {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	z-index: 998;
}

.hamburger-btn {
	position: relative;
	display: inline-block;
	width: 30px;
	height: 30px;
	padding: 0;
	margin: 0;
	background: none;
	outline: none;
	border: none;

	&:hover, &:active, &:focus, &.menu-active {
		outline: none;
		background: none;
		border: none;

		span {
			background: primary;
			transition: background 0.3s ease;
			top: 13px;
		}
	}

	span {
		position: absolute;
		display: block;
		top: 13px;
		width: 30px;
		height: 4px;
		background: #666;
		border-radius: 2px;
		transition: top 0.5s ease;

		&:first-child {
			top: 5px;
		}

		&:last-child {
			top: 21px;
		}
	}
}
</style>