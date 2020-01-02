import Vue from 'vue';
import VueRouter from 'vue-router';

import WalletsView from '@/views/WalletsView.vue';

Vue.use(VueRouter);

const routes = [
	{
		path: '/',
		name: 'wallets',
		component: WalletsView
	}
];

const router = new VueRouter({
	mode: 'history',
	base: process.env.BASE_URL,
	routes
});

export default router;
