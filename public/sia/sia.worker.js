/* global importScripts, Go, sia */
importScripts('/sia/wasm_exec.js');

const go = new Go();

const loaded = WebAssembly.instantiateStreaming(fetch(`/sia/sia.wasm`), go.importObject).then((result) => {
	go.run(result.instance);
});

onmessage = async(e) => {
	try {
		if (!Array.isArray(e.data) || e.data.length === 0)
			return;

		const action = e.data[0];
		let params = [];

		if (e.data.length > 1)
			params = e.data.slice(1);

		await Promise.resolve(loaded);

		if (typeof sia[action] !== 'function')
			return;

		params.push((err, value) => {
			postMessage([err, value]);
		});

		if (!sia[action].apply(this, params))
			postMessage(['unknown error']);
	} catch (ex) {
		console.error('onHandleAction', ex);
	}
};
