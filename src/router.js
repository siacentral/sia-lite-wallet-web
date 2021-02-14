import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
	{
		path: '/',
		name: 'wallets',
		component: () => import('@/views/Wallets.vue')
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue')
	},
	{
		path: '/about',
		name: 'about',
		component: () => import(/* webpackChunkName: "about" */ '@/views/About.vue'),
		meta: {
			insecure: true
		}
	}
];

const router = new VueRouter({
	mode: 'history',
	base: process.env.BASE_URL,
	routes
});

export default router;
