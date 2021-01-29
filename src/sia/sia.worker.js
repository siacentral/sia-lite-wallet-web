/* global sia, Go */
import { loadWASM } from './wasm.js';

async function load() {
	try {
		await loadWASM();
		postMessage('ready');
	} catch (ex) {
		postMessage([ex.message]);
	}
}

const loaded = load();

onmessage = async(e) => {
	try {
		if (!Array.isArray(e.data) || e.data.length === 0)
			return;

		const action = e.data[0];

		let params = [];

		if (e.data.length > 1)
			params = e.data.slice(1);

		await loaded;

		if (typeof sia[action] !== 'function') {
			postMessage([`${action} not found`]);
			return;
		}

		params.push((err, value) => {
			postMessage([err, value]);
		});

		const error = global.sia[action].apply(this, params);

		if (typeof error === 'string')
			postMessage([`${action}: ${error}`]);
	} catch (ex) {
		postMessage([ex.message]);
		console.error('onHandleAction', ex);
	}
};
