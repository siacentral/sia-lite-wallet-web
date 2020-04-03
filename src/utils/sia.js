let siaModule;

async function load() {
	if (WebAssembly.compileStreaming)
		siaModule = await WebAssembly.compileStreaming(fetch(`/sia/sia.wasm`));
	else {
		const resp = await fetch('/sia/sia.wasm'),
			buf = await resp.arrayBuffer();

		siaModule = await WebAssembly.compile(buf);
	}
}

const loaded = load();

async function defaultSpawnWorker(params, timeout) {
	let worker = new Worker('/sia/sia.worker.js'),
		work;

	await Promise.resolve(loaded);

	work = new Promise((resolve, reject) => {
		let workerDeadline = setTimeout(() => {
			reject(new Error('response timeout'));
		}, timeout);

		worker.onmessage = (e) => {
			const data = e.data;

			clearTimeout(workerDeadline);

			if (data === 'ready') {
				worker.postMessage(params);
				return;
			}

			if (!Array.isArray(data)) {
				console.error(data);
				return reject(new Error('unexpected data'));
			}

			if (data[0] === 'log') {
				console.debug(data[1]);
				return;
			}

			if (data[0])
				return reject(new Error(data[0]));

			resolve(data[1]);
		};
	});

	worker.postMessage(['module', siaModule]);
	work.finally(() => {
		worker.terminate();
		worker = null;
	});

	return work;
}

export function generateSeed(type) {
	return defaultSpawnWorker(['generateSeed', type], 15000);
}

export function generateAddresses(seed, i, n) {
	return defaultSpawnWorker(['generateAddresses', seed, i, n], 15000);
}

export function getTransactions(addresses) {
	return defaultSpawnWorker(['getTransactions', addresses], 30000);
}

export function signTransaction(seed, txn, indexes) {
	return defaultSpawnWorker(['signTransaction', seed, JSON.stringify(txn), indexes], 15000);
}

export function encodeTransaction(txn) {
	return defaultSpawnWorker(['encodeTransaction', JSON.stringify(txn)], 15000);
}

export function encodeUnlockHash(unlockconditions) {
	return defaultSpawnWorker(['encodeUnlockHash', JSON.stringify(unlockconditions)], 15000);
}

export function encodeUnlockHashes(unencoded) {
	return defaultSpawnWorker(['encodeUnlockHashes', unencoded.map(u => JSON.stringify(u))], 15000);
}

export async function recoverAddresses(seed, i, n, count, last, progress) {
	let worker = new Worker('/sia/sia.worker.js'),
		work;

	await Promise.resolve(loaded);

	work = new Promise((resolve, reject) => {
		let workerDeadline = setTimeout(() => {
			reject(new Error('response timeout'));
		}, 30000);

		worker.onmessage = (e) => {
			const data = e.data;

			clearTimeout(workerDeadline);

			if (data === 'ready') {
				worker.postMessage(['recoverAddresses', seed, i, n, count, last]);
				return;
			}

			if (!Array.isArray(data))
				return reject(new Error('unexpected data'));

			if (data[0] === 'log') {
				console.debug(data[1]);
				return;
			}

			if (data[0])
				return reject(new Error(data[0]));

			progress(data[1]);

			if (typeof data[1].done === 'boolean' && data[1].done)
				return resolve(data[1]);

			workerDeadline = setTimeout(() => {
				reject(new Error('response timeout'));
			}, 30000);
		};
	});

	worker.postMessage(['module', siaModule]);
	work.finally(() => {
		worker.terminate();
		worker = null;
	});

	return work;
}