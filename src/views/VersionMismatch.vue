<template>
	<div class="page page-unlock">
		<div class="page-content">
			<div class="page-icon"><icon icon="exclamation-triangle" /></div>
			<h2 class="text-center text-warning">{{ translate('version.header') }}</h2>
			<p>{{ translate('version.explain') }}</p>
			<p class="text-warning text-center">{{ translate('version.walletLabel') }}: {{ walletRevision }}</p>
			<div>
				<h4>Contact:</h4>
				<ul>
					<li><a href="https://discord.gg/sia" target="_blank">{{ translate('ofac.discordLabel') }}</a></li>
					<li><a href="https://github.com/siacentral/sia-lite-wallet-web/issues" target="_blank">{{ translate('ofac.githubLabel') }}</a></li>
					<li><a href="mailto:hi@siacentral.com?subject=Old Wallet" target="_blank">hi@siacentral.com</a></li>
				</ul>
			</div>
			<div class="text-center">
				<button class="btn btn-success btn-inline btn-warning" @click="setIgnoreVersionWarning(true)">{{ translate('continue') }}</button>
			</div>
		</div>
	</div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
	computed: {
		...mapState(['walletRevision'])
	},
	methods: {
		...mapActions(['setIgnoreVersionWarning'])
	}
};
</script>

<style lang="stylus" scoped>
.page-unlock {
	position: fixed;
	background: bg-dark;
	z-index: 99;
}

h2, p {
	margin: 0;
}

.page-icon {
	text-align: center;
	color: warning-accent;

	svg {
		width: 48px;
		height: auto;
	}
}

.btn.btn-inline {
	margin-right: 0;
}

.page-content {
	display: grid;
	height: 100%;
	max-width: 700px;
	margin: auto;
	padding: 15px;
	grid-gap: 30px;
	align-content: safe center;
	overflow-x: hidden;
	overflow-y: auto;
}

.text-secondary {
	color: rgba(255, 255, 255, 0.24);
}
</style>