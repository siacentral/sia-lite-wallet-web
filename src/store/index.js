import Vue from 'vue';
import Vuex from 'vuex';
import { hash } from 'tweetnacl';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { saveWallet, loadWallets, deleteWallet } from './db';
import { scanner } from '@/sync/scanner';
import { getCoinPrice, getNetworkFees } from '@/api/siacentral';
import Wallet from '@/types/wallet';

Vue.use(Vuex);

const store = new Vuex.Store({
	state: {
		setup: false,
		unlocked: false,
		password: null,
		wallets: [],
		notifications: [],
		scanQueue: [],
		currency: 'usd',
		networkFees: {},
		currencies: {}
	},
	mutations: {
		setSetup(state, setup) {
			state.setup = setup;
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
		deleteWallet(state, id) {
			const idx = state.wallets.findIndex(w => w.id === id);

			if (idx === -1)
				return;

			state.wallets.splice(idx, 1);
		},
		setExchangeRate(state, rates) {
			state.currencies = rates;
		},
		setNetworkFees(state, fees) {
			state.networkFees = fees;
		},
		pushNotification(state, notification) {
			state.notifications.push(notification);
		},
		clearNotification(state) {
			if (state.notifications.length === 0)
				return;

			state.notifications.shift();
		},
		queueWallet(state, { walletID, full }) {
			full = typeof full === 'boolean' ? full : false;

			if (state.scanQueue.findIndex(w => w.id === walletID && w.full === full) !== -1)
				return;

			state.scanQueue.push({
				walletID,
				full
			});
		},
		shiftWallet(state) {
			return state.scanQueue.shift();
		}
	},
	actions: {
		setSetup({ commit }, setup) {
			commit('setSetup', setup);
		},
		setPassword({ commit }, password) {
			commit('setPassword', password);
		},
		async unlockWallets({ commit, dispatch }, password) {
			const wallets = await loadWallets(password);

			commit('setWallets', wallets);
			commit('setPassword', password);

			wallets.forEach(w => dispatch('queueWallet', { walletID: w.id, full: false }));
			wallets.forEach(w => dispatch('queueWallet', { walletID: w.id, full: false }));
		},
		async saveWallet({ commit, state }, wallet) {
			const existing = state.wallets.find(w => w.id === wallet.id);

			if (!existing)
				throw new Error(`unknown wallet ${wallet.id}`);

			const id = await saveWallet({
				...existing,
				...wallet
			}, state.password);

			commit('saveWallet', {
				...wallet,
				id
			});

			return id;
		},
		async createWallet({ commit, state }, wallet) {
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
		async deleteWallet({ commit, state }, walletID) {
			await deleteWallet(walletID);

			commit('deleteWallet', walletID);
		},
		setExchangeRate({ commit }, rates) {
			commit('setExchangeRate', rates);
		},
		setNetworkFees({ commit }, fees) {
			commit('setNetworkFees', fees);
		},
		pushNotification({ commit }, notification) {
			commit('pushNotification', notification);
		},
		clearNotification({ commit }) {
			commit('clearNotification');
		},
		queueWallet({ commit }, scan) {
			commit('queueWallet', scan);
			setTimeout(scanner, 0);
		},
		shiftWallet({ commit, state }) {
			const item = state.scanQueue[0];

			commit('shiftWallet');

			return item;
		}
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