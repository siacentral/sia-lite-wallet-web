<template>
	<div class="primary-nav">
		<div class="upper">
			<div class="nav-logo">
				<sia-central />
			</div>
			<router-link :to="{ name: 'wallets' }" class="menu-item">
				<icon icon="wallet" />
			</router-link>
			<router-link :to="{ name: 'address-book' }" class="menu-item">
				<icon icon="address-book" />
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
import SiaCentral from '@/assets/siacentral.svg';

export default {
	components: {
		SiaCentral
	}
};
</script>

<style lang="stylus" scoped>
	.primary-nav {
		display: none;
		padding: 30px 0 15px;
		grid-template-rows: repeat(2, auto);
		align-content: space-between;
		background: bg-dark-accent;
		box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.22);

		@media screen and (min-width: 767px) {
			display: grid;
		}
	}

	body.linux {
		.primary-nav {
			padding-top: 0;
		}
	}

	body.win32 {
		.primary-nav {
			padding: 15px 0;
		}
	}

	.nav-logo {
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 15px;

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