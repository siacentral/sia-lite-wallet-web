/* global sia, Go */
import '@/sia/wasm_exec.js';
import Sia from '@/sia/sia.wasm';

if (!WebAssembly.instantiateStreaming) { // polyfill
	WebAssembly.instantiateStreaming = async(resp, importObject) => {
		const source = await (await resp).arrayBuffer();
		return await WebAssembly.instantiate(source, importObject);
	};
}

export async function loadWASM() {
	const go = new Go(),
		result = await WebAssembly.instantiateStreaming(fetch(Sia), go.importObject);

	go.run(result.instance).catch(ex => console.error('go program exited', ex));

	await new Promise(resolve => setTimeout(resolve, 1));
}

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
