import { randomBytes, secretbox, hash } from 'tweetnacl';
import { encode as encodeB64, decode as decodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8, decode as decodeUTF8 } from '@stablelib/utf8';

export async function pbkdf2(password, salt, iterations = 1e6) {
	if (!salt)
		salt = crypto.getRandomValues(new Uint8Array(16));

	const key = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveBits']),
		keyBuf = new Uint8Array(await crypto.subtle.deriveBits({
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt,
			iterations
		}, key, 256));

	return { salt, hash: keyBuf };
}

export function hexID(n) {
	return Array.prototype.map.call(randomBytes(n), b => b.toString(16).padStart(2, '0')).join('');
}

export function encrypt(str, key) {
	const nonce = randomBytes(secretbox.nonceLength),
		msg = encodeUTF8(str),
		box = secretbox(msg, nonce, key),
		full = new Uint8Array(nonce.length + box.length);

	full.set(nonce);
	full.set(box, nonce.length);

	return encodeB64(full);
}

export function decrypt(encrypted, key) {
	const buf = decodeB64(encrypted),
		nonce = buf.slice(0, secretbox.nonceLength),
		msg = buf.slice(secretbox.nonceLength),
		decrypted = secretbox.open(msg, nonce, key);

	if (!decrypted)
		throw new Error('failed to decrypt');

	return decodeUTF8(decrypted);
}

/**
 * Returns the hex encoded SHA-256 hash of the string
 * @param {String} str the string to hash
 */
export function hashString(str) {
	const buf = encodeUTF8(str),
		data = hash(buf);

	return Array.from(data, (byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}