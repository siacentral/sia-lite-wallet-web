import SiaModule from '@siacentral/ledgerjs-sia';

// ledgerjs-sia ships plain CJS; rolldown-vite doesn't unwrap `exports.default`
// on a default import, in dev or prod, so unwrap manually
const Sia = SiaModule.default ?? SiaModule;

export async function connect(method) {
	switch (method) {
	case 'hid':
		return Sia.connectWebHID();
	case 'ble':
		return Sia.connectBLE();
	default:
		throw new Error(`Unsupported transport method: ${method}`);
	}
}

export function supportedTransports() {
	return Sia.supportedTransports();
}
