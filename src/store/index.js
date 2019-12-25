import Vue from 'vue';
import Vuex from 'vuex';
import { hash } from 'tweetnacl';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { saveWallet, loadWallets } from './db';
import { queueWallet } from '@/sync/scanner';
import { getCoinPrice, getNetworkFees } from '@/api/siacentral';
import Wallet from '@/types/wallet';

Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		siaLoaded: false,
		password: 'password',
		wallets: [],
		currency: 'usd',
		networkFees: {},
		currencies: {}
	},
	mutations: {
		setSiaLoaded(state, loaded) {
			state.siaLoaded = loaded;
		},
		setWallets(state, wallets) {
			state.wallets = wallets.map(w => new Wallet(w));
		},
		setPassword(state, password) {
			state.password = password;
		},
		saveWallet(state, wallet) {
			if (!wallet || !wallet.seed)
				return;

			const id = encodeB64(hash(encodeUTF8(wallet.seed))),
				idx = state.wallets.findIndex(w => w.id === id);

			if (idx === -1) {
				state.wallets.push(new Wallet(wallet));
				return;
			}

			Vue.set(state.wallets, idx, new Wallet({
				...state.wallets[idx],
				...wallet
			}));
		},
		setExchangeRate(state, rates) {
			state.currencies = rates;
		},
		setNetworkFees(state, fees) {
			state.networkFees = fees;
		}
	},
	actions: {
		setSiaLoaded(context, loaded) {
			context.commit('setSiaLoaded', loaded);
		},
		async unlockWallets({ commit }, password) {
			const wallets = await loadWallets(password);

			commit('setWallets', wallets);
			commit('setPassword', password);

			wallets.forEach(w => queueWallet(w, false));
			wallets.forEach(w => queueWallet(w, true));
		},
		async saveWallet({ commit, state }, wallet) {
			const existing = state.wallets.find(w => w.id === wallet.id),
				id = await saveWallet({
					...existing,
					...wallet
				}, state.password);

			commit('saveWallet', {
				...wallet,
				id
			});

			return id;
		},
		setExchangeRate(context, rates) {
			context.commit('setExchangeRate', rates);
		},
		setNetworkFees(context, fees) {
			context.commit('setNetworkFees', fees);
		}
	},
	modules: {
	}
});

async function updateMetadata() {
	try {
		const price = await getCoinPrice(),
			fees = await getNetworkFees();

		store.dispatch('setNetworkFees', fees);
		store.dispatch('setExchangeRate', price);
	} catch (ex) {
		console.error('updatingMeta', ex);
	}
}

updateMetadata();
setInterval(updateMetadata, 300000);

export default store;