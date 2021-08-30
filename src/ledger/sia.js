import TransportWebBLE from '@ledgerhq/hw-transport-web-ble';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import Sia from '@siacentral/ledgerjs-sia';

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

	return new Sia(transport);
}

export async function supportedTransports() {
	const support = await Promise.all([
		TransportWebHID.isSupported().then(supported => supported ? 'hid' : null),
		TransportWebBLE.isSupported().then(async(supported) => supported && !(navigator.brave && await navigator.brave.isBrave()) ? 'ble' : null)
	]);

	return support.filter(t => t);
}