async function spawnWorker(params, timeout, progress) {
	let worker = new Worker('./sia.worker.js', { type: 'module' });

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

			switch (data[0]) {
			case 'log':
				console.debug(data[1]);
				return;
			case 'progress':
				if (typeof progress !== 'function')
					return;

				progress(data[1]);
				return;
			case null:
				resolve(data[1]);
				return;
			default:
				reject(new Error(data[0]));
			}
		};
	});

	work.finally(() => {
		worker.terminate();
		worker = null;
	});

	return work;
}

export function generateSeed(type) {
	return spawnWorker(['generateSeed', type], 15000);
}

export function generateAddresses(seed, currency, i, n) {
	return spawnWorker(['generateAddresses', seed, currency, i, n], 15000);
}

export function getTransactions(addresses, walletCurrency, displayCurrency) {
	return spawnWorker(['getTransactions', addresses, walletCurrency, displayCurrency], 30000);
}

export function signTransaction(seed, currency, txn, indexes) {
	return spawnWorker(['signTransaction', seed, currency, JSON.stringify(txn), indexes], 15000);
}

export function encodeTransaction(txn) {
	return spawnWorker(['encodeTransaction', JSON.stringify(txn)], 15000);
}

export function encodeUnlockHash(unlockconditions) {
	return spawnWorker(['encodeUnlockHash', JSON.stringify(unlockconditions)], 15000);
}

export async function recoverAddresses(seed, currency, i = 0, lookahead = 25000, last = 0, progress) {
	return spawnWorker(['recoverAddresses', seed, currency, i, lookahead, last], 300000, progress);
}

export function v2InputSigHash(txn) {
	return spawnWorker(['v2InputSigHash', JSON.stringify(txn)], 15000);
}

export function v2SignTransaction(seed, txn, indexes) {
	const str = JSON.stringify(txn);
	return spawnWorker(['v2SignTransaction', seed, str, indexes], 15000);
}