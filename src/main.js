import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { walletCount } from './store/db';
import './registerServiceWorker';
/* eslint-disable import/no-webpack-loader-syntax */

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faEye, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faEye, faUsb, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo);

Vue.component('icon', FontAwesomeIcon);

Vue.config.productionTip = false;

document.body.classList.add(process.platform);

Vue.mixin({
	methods: {
		pushNotification(notification) {
			store.dispatch('pushNotification', notification);
		}
	}
});

async function load() {
	store.dispatch('setSetup', (await walletCount()) !== 0);

	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount('#app');
}

load();
