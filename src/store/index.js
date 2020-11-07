import Vue from 'vue';
import Vuex from 'vuex';
import { hash } from 'tweetnacl';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import { saveWallet, loadWallets, deleteWallet } from './db';
import { scanner } from '@/sync/scanner';
import { siaAPI, scprimeAPI } from '@/api/siacentral';
import Wallet from '@/types/wallet';

Vue.use(Vuex);

function getLocalStorageNumeric(key, def) {
	const v = localStorage.getItem(key);

	if (!v || isNaN(v) || !isFinite(v))
		return def;

	return parseInt(v, 10);
}

function migrateRoundsToLookahead() {
	const rounds = getLocalStorageNumeric('minScanRounds', -1),
		addrs = getLocalStorageNumeric('addressesPerRound', -1),
		lookahead = getLocalStorageNumeric('addressLookahead', -1);

	console.log(rounds, addrs, lookahead);

	if (lookahead === -1 && rounds !== -1 && addrs !== -1) {
		console.log('migrating to lookahead', rounds * addrs);
		localStorage.setItem('addressLookahead', rounds * addrs);
	}
}
migrateRoundsToLookahead();

const store = new Vuex.Store({
	state: {
		dbType: 'memory',
		setup: false,
		offline: false,
		autoLock: getLocalStorageNumeric('autoLock', 15),
		currency: localStorage.getItem('displayCurrency') || 'usd',
		changeSeedType: localStorage.getItem('changeSeedType') === 'true',
		changeServerType: localStorage.getItem('changeServerType') === 'true',
		addressLookahead: getLocalStorageNumeric('addressLookahead', 25000),
		displayLanguage: localStorage.getItem('displayLanguage') || 'detect',
		password: null,
		wallets: [],
		notifications: [],
		scanQueue: [],
		siaNetworkFees: {},
		scprimeNetworkFees: {},
		feeAddresses: [],
		exchangeRateSC: {},
		exchangeRateSF: {},
		echangeRateSCP: {},
		exchangeRateSCPF: {}
	},
	mutations: {
		setDBType(state, type) {
			state.dbType = type;
		},
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
		setChangeServerType(state, enabled) {
			state.changeServerType = enabled;
		},
		setAddressLookahead(state, n) {
			state.addressLookahead = n;
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

			let id = wallet.seed;

			if (wallet.currency && wallet.currency !== 'sc')
				id += '-' + wallet.currency;

			id = encodeB64(hash(encodeUTF8(id)));

			const idx = state.wallets.findIndex(w => w.id === id);

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
		setExchangeRate(state, { siacoin, siafund, scprimecoin, scprimefund }) {
			state.exchangeRateSC = siacoin;
			state.exchangeRateSF = siafund;
			state.exchangeRateSCP = scprimecoin;
			state.exchangeRateSCPF = scprimefund;
		},
		setNetworkFees(state, { sia, scprime }) {
			state.siaNetworkFees = sia;
			state.scprimeNetworkFees = scprime;
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
		setDBType({ commit }, dbType) {
			commit('setDBType', dbType);
		},
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
		setChangeServerType({ commit }, enabled) {
			localStorage.setItem('changeServerType', enabled.toString());
			commit('setChangeServerType', enabled);
		},
		setAddressLookahead({ commit }, n) {
			localStorage.setItem('addressLookahead', n);
			commit('setAddressLookahead', n);
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
		const price = await siaAPI.getCoinPrice(),
			siaFees = await siaAPI.getNetworkFees(),
			scprimeFees = await scprimeAPI.getNetworkFees(),
			addresses = await siaAPI.getFeeAddresses();

		store.dispatch('setNetworkFees', {
			sia: siaFees,
			scprime: scprimeFees
		});
		store.dispatch('setExchangeRate', price);
		store.dispatch('setFeeAddresses', addresses);
	} catch (ex) {
		console.error('updatingMeta', ex);
	}
}

updateMetadata();
setInterval(updateMetadata, 300000);

export default store;