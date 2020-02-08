import Vue from 'vue';
import Vuex from 'vuex';
import { hash } from 'tweetnacl';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { saveWallet, loadWallets, deleteWallet } from './db';
import { scanner } from '@/sync/scanner';
import { getCoinPrice, getNetworkFees, getFeeAddresses } from '@/api/siacentral';
import Wallet from '@/types/wallet';

Vue.use(Vuex);

function getLocalStorageNumeric(key, def) {
	let v = localStorage.getItem(key);

	if (!v || isNaN(v) || !isFinite(v))
		return def;

	return parseInt(v, 10);
}

const store = new Vuex.Store({
	state: {
		setup: false,
		offline: false,
		autoLock: getLocalStorageNumeric('autoLock', 15),
		currency: localStorage.getItem('displayCurrency') || 'usd',
		changeSeedType: localStorage.getItem('changeSeedType') === 'true',
		minScanRounds: getLocalStorageNumeric('minScanRounds', 50),
		addressesPerRound: getLocalStorageNumeric('addressesPerRound', 2500),
		displayLanguage: localStorage.getItem('displayLanguage') || 'detect',
		password: null,
		wallets: [],
		notifications: [],
		scanQueue: [],
		networkFees: {},
		feeAddresses: [],
		exchangeRateSC: {},
		exchangeRateSF: {}
	},
	mutations: {
		setSetup(state, setup) {
			state.setup = setup;
		},
		setOffline(state, offline) {
			state.offline = offline;
		},
		setWallets(state, wallets) {
			state.wallets = wallets.map(w => new Wallet(w));
		},
		setFeeAddresses(state, addresses) {
			state.feeAddresses = addresses;
		},
		lockWallets(state) {
			state.wallets = [];
			state.scanQueue = [];
			state.password = null;
		},
		setPassword(state, password) {
			state.password = password;
		},
		setDisplayLanguage(state, language) {
			state.displayLanguage = language;
		},
		setChangeSeedType(state, enabled) {
			state.changeSeedType = enabled;
		},
		setMinFullScanRounds(state, rounds) {
			state.minScanRounds = rounds;
		},
		setAddressesPerRound(state, addressesPerRound) {
			state.addressesPerRound = addressesPerRound;
		},
		setCurrency(state, currency) {
			state.currency = currency;
		},
		setAutoLock(state, autoLock) {
			state.autoLock = autoLock;
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

			Vue.set(state.wallets, idx, new Wallet(wallet));
		},
		deleteWallet(state, id) {
			const idx = state.wallets.findIndex(w => w.id === id);

			if (idx === -1)
				return;

			state.wallets.splice(idx, 1);
		},
		setExchangeRate(state, { siacoin, siafund }) {
			state.exchangeRateSC = siacoin;
			state.exchangeRateSF = siafund;
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
		setOffline({ commit }, offline) {
			commit('setOffline', offline);
		},
		setPassword({ commit }, password) {
			password = hash(encodeUTF8(password));

			commit('setPassword', password);
		},
		setDisplayLanguage({ commit }, language) {
			localStorage.setItem('displayLanguage', language);
			commit('setDisplayLanguage', language);
		},
		setChangeSeedType({ commit }, enabled) {
			localStorage.setItem('changeSeedType', enabled.toString());
			commit('setChangeSeedType', enabled);
		},
		setMinFullScanRounds({ commit }, rounds) {
			localStorage.setItem('minScanRounds', rounds);
			commit('setMinFullScanRounds', rounds);
		},
		setAddressesPerRound({ commit }, addressesPerRound) {
			if (addressesPerRound > 5e3)
				addressesPerRound = 5e3;

			localStorage.setItem('addressesPerRound', addressesPerRound);
			commit('setAddressesPerRound', addressesPerRound);
		},
		setCurrency({ commit }, currency) {
			localStorage.setItem('displayCurrency', currency);
			commit('setCurrency', currency);
		},
		setAutoLock({ commit }, lockMin) {
			localStorage.setItem('autoLock', lockMin);
			commit('setAutoLock', lockMin);
		},
		async unlockWallets({ commit, dispatch }, password) {
			password = hash(encodeUTF8(password));

			const wallets = await loadWallets(password);

			commit('setWallets', wallets);
			commit('setPassword', password);

			wallets.forEach(w => dispatch('queueWallet', { walletID: w.id, full: false }));
		},
		async lockWallets({ commit }) {
			commit('lockWallets');
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
				...existing,
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
		setFeeAddresses({ commit }, addresses) {
			commit('setFeeAddresses', addresses);
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
			fees = await getNetworkFees(),
			addresses = await getFeeAddresses();

		store.dispatch('setNetworkFees', fees);
		store.dispatch('setExchangeRate', price);
		store.dispatch('setFeeAddresses', addresses);
	} catch (ex) {
		console.error('updatingMeta', ex);
	}
}

updateMetadata();
setInterval(updateMetadata, 300000);

export default store;