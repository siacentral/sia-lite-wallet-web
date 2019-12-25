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

/* async function test() {
	const seed = await getEncodedTransaction({
		siacoininputs: [
			{
				'parentid': '9a5c81ee3ba3711c1d52802c6c696b7090ae3820665b1ae717ca35221aabc7fc',
				'unlock_conditions': {
					'timelock': 0,
					'required_signatures': 1,
					'public_keys': ['ed25519:72f135374d904766ead757a9579b66c3d9758301be63c30b9ca4bab4f3709cba']
				}
			}
		],
		siacoinoutputs: [
			{
				'unlock_hash': '9b2661d605dbdbdb7f370aed6991738d706ca32f4739a0f965d143dbd2e64732d9eecfe3c11a',
				'value': '7500000000000000000000'
			}
		]
	});

	console.log(seed);
}

test(); */

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app');
