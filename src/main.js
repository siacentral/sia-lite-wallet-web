import './registerServiceWorker';

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { walletCount } from './store/db';
import { translate, languageSupported } from '@/translation';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faFile, faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faEye, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import { faUsb } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faFile, faFileExport, faUnlock, faLock, faEllipsisV, faChevronLeft, faChevronRight, faEye, faUsb, faPencilAlt, faTrash, faPaperPlane, faWallet, faAddressBook, faCogs, faPlus, faTimes, faRedo);

Vue.component('icon', FontAwesomeIcon);

Vue.config.productionTip = false;

document.body.classList.add(process.platform);

Vue.mixin({
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
	store.dispatch('setSetup', (await walletCount()) !== 0);

	new Vue({
		router,
		store,
		render: h => h(App)
	}).$mount('#app');
}

load();
