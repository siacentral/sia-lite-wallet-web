<template>
	<div class="primary-nav">
		<div class="upper">
			<div class="nav-logo">
				<sia-central />
			</div>
			<transition name="fade" mode="out-in" appear>
				<div v-if="offline" class="connect-status">Offline</div>
			</transition>
			<router-link :to="{ name: 'wallets' }" class="menu-item">
				<icon icon="wallet" />
			</router-link>
		</div>
		<div class="lower">
			<router-link :to="{ name: 'settings' }" class="menu-item">
				<icon icon="cogs" />
			</router-link>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';
import SiaCentral from '@/assets/siacentral.svg';

export default {
	components: {
		SiaCentral
	},
	computed: {
		...mapState(['offline'])
	}
};
</script>

<style lang="stylus" scoped>
	.primary-nav {
		display: none;
		padding: 15px 0 0;
		grid-template-rows: repeat(2, auto);
		align-content: space-between;
		background: bg-dark-accent;
		box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.22);

		@media screen and (min-width: 767px) {
			display: grid;
		}
	}

	body.mac {
		.primary-nav {
			padding-top: 30px;
		}
	}

	.connect-status {
		paddding: 5px;
		background: negative-accent;
		font-size: 0.9rem;
		text-align: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.nav-logo {
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);

		svg {
			display: block;
			width: 3rem;
			height: auto;
			margin: 0 auto 15px;
		}
	}

	.upper, .lower {
		width: 100%;
	}

	a.menu-item {
		display: block;
		width: 75px;
		height: 75px;
		text-align: center;
		color: rgba(255, 255, 255, 0.54);
		font-size: 0.9rem;
		line-height: 75px;
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
</style>