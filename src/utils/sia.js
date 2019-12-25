function defaultSpawnWorker(params, timeout) {
	let worker = new Worker('/sia/sia.worker.js'),
		work = new Promise((resolve, reject) => {
			let workerDeadline = setTimeout(() => {
				reject(new Error('response timeout'));
			}, timeout);

			worker.onmessage = (e) => {
				const data = e.data;

				clearTimeout(workerDeadline);

				if (data[0])
					return reject(new Error(data[0]));

				resolve(data[1]);
			};

			worker.postMessage(params);
		});

	work.finally(() => {
		worker.terminate();
		worker = null;
	});

	return work;
}

export function generateSeed() {
	return defaultSpawnWorker(['generateSeed'], 15000);
}

export function generateAddresses(seed, i, n) {
	return defaultSpawnWorker(['generateAddresses', seed, i, n], 15000);
}

export function getTransactions(addresses) {
	return defaultSpawnWorker(['getTransactions', addresses], 15000);
}

export function signTransaction(seed, txn, indexes) {
	return defaultSpawnWorker(['signTransaction', seed, JSON.stringify(txn), indexes], 15000);
}

export function encodeTransaction(txn) {
	return defaultSpawnWorker(['encodeTransaction', JSON.stringify(txn)], 15000);
}

export function encodeUnlockHash(txn) {
	return defaultSpawnWorker(['encodeUnlockHash', JSON.stringify(txn)], 15000);
}

export function recoverAddresses(seed, i, n, progress) {
	let worker = new Worker('/sia/sia.worker.js'),
		work = new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				reject(new Error('response timeout'));
			}, 60000);

			worker.onmessage = (e) => {
				const data = e.data;

				clearTimeout(timeout);

				if (data[0])
					return reject(new Error(data[0]));

				progress(data[1]);

				if (typeof data[1].done === 'boolean' && data[1].done)
					return resolve(data[1]);

				timeout = setTimeout(() => {
					reject(new Error('response timeout'));
				}, 60000);
			};

			worker.postMessage(['recoverAddresses', seed, i, n]);
		});

	work.finally(() => {
		worker.terminate();
		worker = null;
	});

	return work;
}