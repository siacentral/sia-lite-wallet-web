import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { listen } from '@ledgerhq/logs';
import { Buffer } from 'buffer';
import { decode } from '@stablelib/utf8';

function buildAPDU(cmd, p1, p2, data) {
	if (data && !(data instanceof Uint8Array))
		throw new Error('data must be undefined or a Uint8Array');

	const dataLen = data ? data.length : 0,
		buf = new Uint8Array(5 + dataLen);

	buf.set([0xe0, cmd, p1, p2, dataLen], 0);

	if (dataLen)
		buf.set(data, 5);

	return Buffer.from(buf);
}

function uint32ToBuffer(val) {
	const buf = new ArrayBuffer(4),
		data = new DataView(buf);

	data.setUint32(0, val, false);

	return new Uint8Array(buf);
}

export default class SiaLedger {
	async connect() {
		listen((log) => console.log(log));

		this._transport = await TransportWebHID.create();
		this._transport.setScrambleKey('');
	}

	async getVersion() {
		const apdu = buildAPDU(0x01, 0x00, 0x00),
			resp = await this._transport.exchange(apdu);

		return `v${resp[0]}.${resp[1]}.${resp[2]}`;
	}

	async getAddress(i) {
		const idx = uint32ToBuffer(i),
			apdu = buildAPDU(0x02, 0x00, 0x00, idx),
			resp = await this._transport.exchange(apdu);

		console.log(decode(resp.slice(32, resp.length - 2)));
	}

	static isSupported() {
		return TransportWebHID.isSupported();
	}
}