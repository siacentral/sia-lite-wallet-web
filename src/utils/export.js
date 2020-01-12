import { decode as decodeB64, encode as encodeB64 } from '@stablelib/base64';
import { decode as decodeUTF8 } from '@stablelib/utf8';
import { encrypt, decrypt, pbkdf2 } from '@/utils/crypto';

const exportMagicBytes = new Uint8Array([95, 6, 39, 249]),
	exportMagicNum = new DataView(exportMagicBytes.buffer).getUint32();

export async function exportSeed(seed, password) {
	const { salt, hash } = await pbkdf2(password);

	console.log(seed, hash, salt);

	const encrypted = decodeB64(encrypt(seed, hash)),
		full = new Uint8Array(exportMagicBytes.length + salt.length + encrypted.length);

	full.set(exportMagicBytes);
	full.set(salt, 4);
	full.set(encrypted, 4 + salt.length);

	console.log('export');
	console.log(salt, password, hash);
	console.log(encrypted);

	return full;
}

export function seedEncrypted(data) {
	if (data.length < 4)
		return false;

	if (data instanceof ArrayBuffer)
		return new DataView(data).getUint32() === exportMagicNum;

	return new DataView(data.slice(0, 4).buffer).getUint32() === exportMagicNum;
}

export function importSeed(data, password) {
	if (!seedEncrypted(data))
		return decodeUTF8(data);

	return decryptSeed(data, password);
}

async function decryptSeed(data, password) {
	const salt = data.slice(4, 20),
		encrypted = data.slice(4 + salt.length),
		{ hash } = await pbkdf2(password, salt);

	console.log('import');
	console.log(new Uint8Array(salt), password, hash);
	console.log(new Uint8Array(encrypted));

	return decrypt(encodeB64(encrypted), hash);
}