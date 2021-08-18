import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { decode } from '@stablelib/utf8';
import { Buffer } from 'buffer';
import { encode } from '@stablelib/base64';

console.log(Buffer);

function uint32ToBuffer(val) {
	const buf = Buffer.alloc(4);
	buf.writeUInt32LE(val, 0);
	return buf;
}

class AppSia {
	constructor(transport, scrambleKey = 'Sia') {
		this._transport = transport;
		transport.decorateAppAPIMethods(this, [
			'getAddress',
			'getPublicKey',
			'signTransactionV044',
			'signTransaction'
		], scrambleKey);
	}

	async getVersion() {
		const resp = await this._transport.send(0xe0, 0x01, 0x00, 0x00, Buffer.alloc(0));

		return `v${resp[0]}.${resp[1]}.${resp[2]}`;
	}

	async getAddress(index) {
		const resp = await this._transport.send(0xe0, 0x02, 0x00, 0x00, uint32ToBuffer(index));

		return decode(resp.slice(32));
	}

	async getPublicKey(index) {
		const resp = await this._transport.send(0xe0, 0x02, 0x00, 0x01, uint32ToBuffer(index));

		return `ed25519:${resp.slice(0, 32).reduce((v, b) => v + ('0' + b.toString(16)).slice(-2), '')}`;
	}

	async signTransactionV044(encodedTxn, sigIndex, keyIndex) {
		const buf = Buffer.alloc(encodedTxn.length + 6);
		let resp;

		if (encodedTxn.length === 0)
			throw new Error('empty transaction');

		buf.writeUInt32LE(keyIndex, 0);
		buf.writeUInt16LE(sigIndex, 4);
		buf.set(encodedTxn, 6);

		for (let i = 0; i < encodedTxn.length; i += 255) {
			resp = await this._transport.send(0xe0,
				0x08,
				i === 0 ? 0x00 : 0x80,
				0x01,
				Buffer.from(buf.subarray(i, i + 255)));
		}

		return encode(resp);
	}

	async signTransaction(encodedTxn, sigIndex, keyIndex, changeIndex) {
		const buf = Buffer.alloc(encodedTxn.length + 6);
		let resp = Buffer.alloc(0);

		if (encodedTxn.length === 0)
			throw new Error('empty transaction');

		buf.writeUInt32LE(keyIndex, 0);
		buf.writeUInt16LE(sigIndex, 4);
		buf.writeUInt32LE(changeIndex, 6);
		buf.set(encodedTxn, 10);

		for (let i = 0; i < encodedTxn.length; i += 250) {
			const b = buf.subarray(i, i + 250),
				b2 = Buffer.alloc(b.length);

			b2.set(b);
			resp = await this._transport.send(0xe0,
				0x08,
				i === 0 ? 0x00 : 0x80,
				0x01,
				b2);
		}

		return encode(resp);
	}

	close() {
		return this._transport.close();
	}
}

export async function connect(method) {
	let transport;
	switch (method) {
	case 'hid':
		transport = await TransportWebHID.create();
		break;
	case 'ble':
		transport = await TransportWebBLE.create();
		break;
	default:
		throw new Error(`Unsupported transport method: ${method}`);
	}

	return new AppSia(transport);
}

export async function supportedTransports() {
	const support = await Promise.all([
		TransportWebHID.isSupported().then(supported => supported ? 'hid' : null),
		TransportWebBLE.isSupported().then(async(supported) => supported && !(navigator.brave && await navigator.brave.isBrave()) ? 'ble' : null)
	]);

	return support.filter(t => t);
}