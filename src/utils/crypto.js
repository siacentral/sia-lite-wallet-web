import { randomBytes, secretbox } from 'tweetnacl';
import { encode as encodeB64, decode as decodeB64 } from '@stablelib/base64';
import { encode as encodeUTF8, decode as decodeUTF8 } from '@stablelib/utf8';

export async function pbkdf2(password, salt, iterations = 1e6) {
	if (!salt)
		salt = crypto.getRandomValues(new Uint8Array(16));

	const buf = password,
		key = await crypto.subtle.importKey('raw', buf, 'PBKDF2', false, ['deriveBits']),
		keyBuf = new Uint8Array(await crypto.subtle.deriveBits({
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt,
			iterations
		}, key, 256));

	return { salt, hash: keyBuf };
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