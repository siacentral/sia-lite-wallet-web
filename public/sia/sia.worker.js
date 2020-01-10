/* global importScripts, Go, sia */
importScripts('/sia/wasm_exec.js');

var sia, go, result;

function log() {
	postMessage(['log', Array.from(arguments).map(a => a && a.toString ? a.toString() : '').join(' ')]);
}

onmessage = async(e) => {
	try {
		if (!Array.isArray(e.data) || e.data.length === 0)
			return;

		const action = e.data[0];

		if (action === 'module') {
			go = new Go();
			result = await WebAssembly.instantiate(e.data[1], go.importObject);

			go.run(result).catch((ex) => postMessage([ex.message]));

			setTimeout(() => postMessage('ready'), 0);
			return;
		}

		let params = [];

		if (e.data.length > 1)
			params = e.data.slice(1);

		if (typeof sia[action] !== 'function') {
			postMessage([`${action} not found`]);
			return;
		}

		params.push((err, value) => {
			postMessage([err, value]);
		});

		if (!global.sia[action].apply(this, params))
			postMessage(['unknown error']);
	} catch (ex) {
		postMessage([ex.message]);
		console.error('onHandleAction', ex);
	}
};
