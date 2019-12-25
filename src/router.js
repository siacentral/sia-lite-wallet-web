import Vue from 'vue';
import VueRouter from 'vue-router';

import WalletsView from '@/views/WalletsView.vue';
import AddressBook from '@/views/AddressBook.vue';

Vue.use(VueRouter);

const routes = [
	{
		path: '/',
		name: 'wallets',
		component: WalletsView
	},
	{
		path: '/addresses',
		name: 'address-book',
		component: AddressBook
	},
	{
		path: '/settings',
		name: 'settings',
		component: WalletsView
	}
];

const router = new VueRouter({
	mode: 'history',
	base: process.env.BASE_URL,
	routes
});

export default router;
