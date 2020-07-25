import Dexie from 'dexie';

import { hash } from 'tweetnacl';
import { encrypt, decrypt, pbkdf2 } from '@/utils/crypto';
import { encode as encodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8 } from '@stablelib/utf8';
import BigNumber from 'bignumber.js';

const db = new Dexie('sia-lite');

db.version(1).stores({
	wallets: 'id',
	addresses: '[address+wallet_id],wallet_id,index'
});

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

	await db.wallets.put({
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

async function unlockWallet(wallet, password) {
	const key = await pbkdf2(password, wallet.salt);

	return {
		...wallet,
		seed: decrypt(wallet.seed, key.hash)
	};
}

// temporary function to migrate wallet seeds encrypted with p to encrypted with h(p)
export async function migrateWallets(password) {
	const promises = [];
	let wallets;

	try {
		wallets = await loadWallets(encodeUTF8(password));
	} catch (ex) {
		// error indicates the seed is not encrypted with p
		return;
	}

	console.debug('migrating seed encryption');

	// renecrypt each wallet with h(p)
	for (let i = 0; i < wallets.length; i++)
		promises.push(saveWallet(wallets[i], hash(encodeUTF8(password))));

	await Promise.all(promises);

	console.debug(`${promises.length} seeds migrated`);
}

export async function loadWallets(password) {
	const wallets = await db.wallets.toArray(),
		promises = [];

	for (let i = 0; i < wallets.length; i++)
		promises.push(unlockWallet(wallets[i], password));

	return Promise.all(promises);
}

export function walletCount() {
	return db.wallets.count();
}

export function saveAddresses(addresses) {
	if (!Array.isArray(addresses))
		return;

	return db.addresses.bulkPut(addresses);
}

export function getWalletAddresses(walletID) {
	return db.addresses.filter(a => a.wallet_id === walletID)
		.sortBy('index');
}

export function getWalletUnlockHashes(walletID) {
	return db.addresses.filter(a => a.wallet_id === walletID).keys();
}

export function getAddresses(walletID, addresses) {
	if (!Array.isArray(addresses))
		addresses = [addresses];

	return db.addresses.filter(a => a.wallet_id === walletID && addresses.indexOf(a.address) !== -1).toArray();
}

export async function getWalletChangeAddress(walletID) {
	let addr = await db.addresses.orderBy('index').filter(a => a.wallet_id === walletID && a.usage_type !== 'sent').first();

	if (!addr)
		addr = await db.addresses.orderBy('index').filter(a => a.wallet_id === walletID).last();

	return addr;
}

export function getLastWalletAddresses(walletID, limit, offset) {
	offset = offset || 0;
	limit = limit || 20;

	return db.addresses.orderBy('index').reverse().filter(a => a.wallet_id === walletID).offset(offset).limit(limit).toArray();
}

export async function deleteWallet(walletID) {
	return Promise.all([
		db.addresses.filter(a => a.wallet_id === walletID).delete(),
		db.wallets.filter(w => w.id === walletID).delete()
	]);
}