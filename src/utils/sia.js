let siaModule;

async function load() {
	if (WebAssembly.compileStreaming)
		siaModule = await WebAssembly.compileStreaming(fetch('/sia/sia.wasm'));
	else {
		const resp = await fetch('/sia/sia.wasm'),
			buf = await resp.arrayBuffer();

		siaModule = await WebAssembly.compile(buf);
	}
}

const loaded = load();

async function defaultSpawnWorker(params, timeout) {
	let worker = new Worker('/sia/sia.worker.js');

	await Promise.resolve(loaded);

	const work = new Promise((resolve, reject) => {
		const workerDeadline = setTimeout(() => {
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

export function generateAddresses(seed, currency, i, n) {
	return defaultSpawnWorker(['generateAddresses', seed, currency, i, n], 15000);
}

export function signTransactions(seed, currency, unsigned) {
	return defaultSpawnWorker(['signTransactions', seed, currency, JSON.stringify(unsigned)], 15000);
}

export function getTransactions(addresses, currency) {
	return defaultSpawnWorker(['getTransactions', addresses, currency], 30000);
}

export async function exportTransactions(addresses, currency, min, max, progress) {
	let worker = new Worker('/sia/sia.worker.js');

	await Promise.resolve(loaded);

	const work = new Promise((resolve, reject) => {
		let workerDeadline = setTimeout(() => {
			reject(new Error('response timeout'));
		}, 30000);

		worker.onmessage = (e) => {
			const data = e.data;

			clearTimeout(workerDeadline);

			if (data === 'ready') {
				worker.postMessage(['exportTransactions', addresses, currency, min, max]);
				return;
			}

			if (!Array.isArray(data))
				return reject(new Error('unexpected data'));

			if (data[0] === 'log') {
				console.debug(data[1]);
				return;
			}

			if (data[0] === null)
				return resolve(data[1]);

			if (data[0] === 'progress')
				progress(data[1]);

			if (data[0] !== 'progress')
				return reject(new Error(data[0]));

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

export function signTransaction(seed, currency, txn, indexes) {
	return defaultSpawnWorker(['signTransaction', seed, currency, JSON.stringify(txn), indexes], 15000);
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

export async function recoverAddresses(seed, currency, i, n, count, last, progress) {
	let worker = new Worker('/sia/sia.worker.js');

	await Promise.resolve(loaded);

	const work = new Promise((resolve, reject) => {
		let workerDeadline = setTimeout(() => {
			reject(new Error('response timeout'));
		}, 30000);

		worker.onmessage = (e) => {
			const data = e.data;

			clearTimeout(workerDeadline);

			if (data === 'ready') {
				worker.postMessage(['recoverAddresses', seed, currency, i, n, count, last]);
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