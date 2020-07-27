/* global sia, Go */
importScripts('/sia/wasm_exec.js');
import Sia from './sia.wasm';

async function load() {
	const go = new Go(),
		siaModule = await WebAssembly.compile(Sia),
		result = await WebAssembly.instantiate(siaModule, go.importObject);

	go.run(result).catch((ex) => postMessage([ex.message]));

	setTimeout(() => postMessage('ready'), 0);
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
