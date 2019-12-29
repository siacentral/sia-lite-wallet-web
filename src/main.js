import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './registerServiceWorker';
/* eslint-disable import/no-webpack-loader-syntax */

import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronLeft, faChevronRight, faEye, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faChevronLeft, faChevronRight, faEye, faUsb, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo);

Vue.component('icon', FontAwesomeIcon);

Vue.config.productionTip = false;

document.body.classList.add(process.platform);

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app');
