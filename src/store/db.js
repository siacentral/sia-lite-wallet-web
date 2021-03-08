import DexieStore from './db/dexie';
import MemoryStore from './db/memory';

import { hash } from 'tweetnacl';
import { encrypt, pbkdf2 } from '@/utils/crypto';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import BigNumber from 'bignumber.js';

let db;

export async function connect() {
	try {
		const dexie = new DexieStore();

		await dexie.init();

		db = dexie;
		return 'dexie';
	} catch (ex) {
		console.error('dexie', ex);
	}

	const mem = new MemoryStore();

	await mem.init();

	db = mem;

	return 'memory';
}

export async function saveWallet(wallet, password) {
	if (!wallet || !wallet.seed || wallet.seed.length === 0)
		throw new Error('wallet requires seed');

	let id = wallet.seed;

	if (wallet.currency && wallet.currency !== 'sc')
		id += '-' + wallet.currency;

	const walletID = encodeB64(hash(encodeUTF8(id))),
		key = await pbkdf2(password, wallet.salt);

	let confirmedSiafundBalance = new BigNumber(wallet.confirmed_siafund_balance),
		confirmedSiacoinBalance = new BigNumber(wallet.confirmed_siacoin_balance),
		unconfirmedSiafundDelta = new BigNumber(wallet.unconfirmed_siacoin_delta),
		unconfirmedSiacoinDelta = new BigNumber(wallet.unconfirmed_siafund_delta);

	if (confirmedSiafundBalance.isNaN() || !confirmedSiafundBalance.isFinite())
		confirmedSiafundBalance = new BigNumber(0);

	if (confirmedSiacoinBalance.isNaN() || !confirmedSiacoinBalance.isFinite())
		confirmedSiacoinBalance = new BigNumber(0);

	if (unconfirmedSiafundDelta.isNaN() || !unconfirmedSiafundDelta.isFinite())
		unconfirmedSiafundDelta = new BigNumber(0);

	if (unconfirmedSiacoinDelta.isNaN() || !unconfirmedSiacoinDelta.isFinite())
		unconfirmedSiacoinDelta = new BigNumber(0);

	await db.saveWallet({
		...wallet,
		id: walletID,
		salt: key.salt,
		server_type: wallet.server_type || 'siacentral',
		server_url: wallet.server_url,
		seed: encrypt(wallet.seed, key.hash),
		confirmed_siafund_balance: confirmedSiafundBalance.toString(10),
		confirmed_siacoin_balance: confirmedSiacoinBalance.toString(10),
		unconfirmed_siacoin_delta: unconfirmedSiafundDelta.toString(10),
		unconfirmed_siafund_delta: unconfirmedSiacoinDelta.toString(10)
	});

	return walletID;
}

export function loadWallets(password) {
	return db.getWallets(password);
}

export function walletCount() {
	return db.walletCount();
}

export function saveAddresses(addresses) {
	return db.saveAddresses(addresses);
}

export function getWalletAddresses(walletID) {
	return db.getWalletAddresses(walletID);
}

export function getWalletUnlockHashes(walletID) {
	return db.getWalletUnlockHashes(walletID);
}

export function getAddresses(walletID, addresses) {
	return db.getAddresses(walletID, addresses);
}

export function getWalletChangeAddress(walletID) {
	return db.getWalletChangeAddress(walletID);
}

export function getLastWalletAddresses(walletID, limit, offset) {
	return db.getLastWalletAddresses(walletID, limit, offset);
}

export function deleteWallet(walletID) {
	return db.deleteWallet(walletID);
}

export function reset() {
	return db.reset();
}