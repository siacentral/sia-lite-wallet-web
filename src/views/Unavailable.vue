<template>
	<div class="page page-unlock">
		<div class="page-content">
			<div class="page-icon"><icon icon="exclamation-triangle" /></div>
			<template v-if="unavailable === 'ofac blocked'">
				<h2 class="text-center text-warning">{{ translate('ofac.blockedHeader') }}</h2>
				<p>{{ translate('ofac.blockedExplain1') }}</p>
				<p>{{ translate('ofac.blockedExplain2') }}</p>
				<div>
					<h4>Resources:</h4>
					<ul>
						<li><a href="https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-programs-and-country-information" target="_blank">US Department of the Treasury Sanctions Information</a></li>
						<li><a href="https://home.treasury.gov/policy-issues/financial-sanctions/recent-actions/20201230_33" target="_blank">US Department of the Treasury vs BitGo, Inc Settlement Agreement</a></li>
					</ul>
					<h4>Contact:</h4>
					<ul>
						<li><a href="https://discord.gg/sia" target="_blank">{{ translate('ofac.discordLabel') }}</a></li>
						<li><a href="https://github.com/siacentral/sia-lite-wallet-web/issues" target="_blank">{{ translate('ofac.githubLabel') }}</a></li>
						<li><a href="mailto:hi@siacentral.com?subject=OFAC Blocked" target="_blank">hi@siacentral.com</a></li>
					</ul>
				</div>
			</template>
			<template v-else>

			</template>
			<div class="text-center">
				<button class="btn btn-success btn-inline btn-warning" @click="setUnavailable(null)">{{ translate('confirm') }}</button>
			</div>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
	computed: {
		...mapState(['unavailable'])
	},
	methods: {
		...mapActions(['setUnavailable'])
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