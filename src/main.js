import './registerServiceWorker';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { connect, walletCount } from './store/db';
import { translate, languageSupported } from '@/translation';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faExclamationTriangle, faCreditCard, faSitemap, faFile, faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faChevronDown, faEye, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faBluetoothB, faUsb, faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faBluetoothB, faExclamationTriangle, faCreditCard, faSitemap, faFile, faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faChevronDown, faEye, faUsb, faGithub, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo);

Vue.component('icon', FontAwesomeIcon);

Vue.config.productionTip = false;

document.body.classList.add(process.platform);

Vue.mixin({
	computed: {
		uiRevision() {
			return process.env.VUE_APP_VERSION || 'devel';
		}
	},
	methods: {
		translate(id) {
			let language = store.state.displayLanguage;

			if (store.state.displayLanguage === 'detect') {
				language = (navigator.language || '').slice(0, 2);

				if (!languageSupported(language))
					language = 'en';
			}

			return translate.apply(this, [id, language].concat(Array.from(arguments).slice(1)));
		},
		pushNotification(notification) {
			store.dispatch('pushNotification', notification);
		},
		queueWallet(walletID, full) {
			store.dispatch('queueWallet', { walletID, full });
		}
	}
});

async function load() {
	const dbType = await connect();

	store.dispatch('setDBType', dbType);
	store.dispatch('setSetup', (await walletCount()) !== 0);

	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount('#app');
}

load();
