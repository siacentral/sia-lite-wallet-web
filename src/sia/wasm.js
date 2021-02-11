/* global Go */
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