/* global Go */
import Sia from './sia.wasm';

export async function loadWASM() {
	const go = new Go(),
		siaModule = await WebAssembly.compile(Sia),
		result = await WebAssembly.instantiate(siaModule, go.importObject);

	go.run(result).catch(ex => console.error('go program exiited', ex));

	await new Promise(resolve => setTimeout(resolve, 1));
}