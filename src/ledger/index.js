import { ledgerUSBVendorId } from '@ledgerhq/devices';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { listen } from '@ledgerhq/logs';
import { Buffer } from 'buffer';
import { decode } from '@stablelib/utf8';
import { encode } from '@stablelib/base64';

let transport;

const CODE_SUCCESS = 0x9000,
	CODE_USER_REJECTED = 0x6985,
	CODE_INVALID_PARAM = 0x6b01,
	CODE_INVALID_INIT = 0x6b02;

function getHID() {
	const { hid } = navigator;
	if (!hid)
		throw new Error('navigator.hid is not supported');

	return hid;
};

async function requestLedgerDevice() {
	const device = await getHID().requestDevice({ filters: [{ vendorId: ledgerUSBVendorId }] });

	if (device.length === 0)
		throw new Error('no device selected');

	return device;
}

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
	const buf = new Uint8Array(4),
		data = new DataView(buf.buffer);

	data.setUint32(0, val, true);

	return buf;
}

function typedArrayToUint16(val) {
	const data = new DataView(val.buffer);

	return data.getUint16(0, false);
}

async function connect() {
	listen((log) => console.debug(log));

	const transports = await supportedTransports();

	if (transports.indexOf('hid') !== -1) {
		const approved = await TransportWebHID.list();

		if (!Array.isArray(approved) || approved.length === 0)
			await requestLedgerDevice();

		transport = await TransportWebHID.openConnected();
	} else
		throw new Error('no supported transports');

	transport.setScrambleKey('');
}

async function exchange(cmd, p1, p2, data) {
	const apdu = buildAPDU(cmd, p1, p2, data),
		resp = await transport.exchange(apdu),
		code = typedArrayToUint16(Uint8Array.from(resp.slice(resp.length - 2)));

	switch (code) {
	case CODE_SUCCESS:
		break;
	case CODE_USER_REJECTED:
		throw new Error('user rejected');
	case CODE_INVALID_PARAM:
		throw new Error('invalid param');
	case CODE_INVALID_INIT:
		throw new Error('restart sia app');
	default:
		throw new Error(`unknown error code: ${code}`);
	}

	return Uint8Array.from(resp.slice(0, resp.length - 2));
}

export async function connected() {
	try {
		if (!transport)
			await connect();

		await getVersion();
		return true;
	} catch (ex) { return false; }
}

export async function getVersion() {
	if (!transport)
		await connect();

	const resp = await exchange(0x01, 0x00, 0x00, null, false);

	return `v${resp[0]}.${resp[1]}.${resp[2]}`;
}

export async function getAddress(i) {
	if (!transport)
		await connect();

	const idx = uint32ToBuffer(i),
		resp = await exchange(0x02, 0x00, 0x00, idx);

	return decode(resp.slice(32));
}

export async function getPublicKey(i) {
	if (!transport)
		await connect();

	const idx = uint32ToBuffer(i),
		resp = await exchange(0x02, 0x00, 0x01, idx);

	return `ed25519:${resp.slice(0, 32).reduce((v, b) => v + ('0' + b.toString(16)).slice(-2), '')}`;
}

export async function signTransaction(encodedTxn, sig, key) {
	if (!transport)
		await connect();

	const buf = Buffer.alloc(encodedTxn.length + 6);
	let resp;

	buf.writeInt32LE(key, 0);
	buf.writeInt16LE(sig, 4);
	buf.set(encodedTxn, 6);

	for (let i = 0; i < encodedTxn.length; i += 255) {
		const p1 = i === 0 ? 0x00 : 0x80,
			data = buf.subarray(i, i + 255);

		resp = await exchange(0x08, p1, 0x01, data);
	}

	return encode(resp);
}

async function supportedTransports() {
	const support = await Promise.all([
		TransportWebHID.isSupported().then(supported => supported ? 'hid' : null)
	]);

	return support.filter(t => t);
}

export async function ledgerSupported() {
	return (await supportedTransports()).length !== 0;
}