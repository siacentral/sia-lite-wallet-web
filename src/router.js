import { createRouter, createWebHistory } from 'vue-router';

const routes = [
	{
		path: '/',
		name: 'wallets',
		component: () => import('@/views/Wallets.vue')
	},
	{
		path: '/settings',
		name: 'settings',
		component: () => import('@/views/Settings.vue')
	},
	{
		path: '/about',
		name: 'about',
		component: () => import('@/views/About.vue'),
		meta: {
			insecure: true
		}
	}
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
});

export default router;
