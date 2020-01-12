export function getLastItems(arr, n) {
	const len = arr.length,
		min = Math.min(len, n),
		d = len - min;

	let values = [];

	for (let i = len - 1; i >= d; i--)
		values.unshift(arr[i]);

	return values;
};

export function concatUint8Array() {
	let totalSize = 0,
		offset = 0,
		array;

	for (let i = 0; i < arguments.length; i++)
		totalSize += arguments[i].length;

	array = new Uint8Array(totalSize);

	for (let i = 0; i < arguments.length; i++) {
		array.set(arguments[i], offset);

		offset += arguments[i].length;
	}

	return array;
};

/**
 * Splits a Uint8Array into equal segments of n length
 * @param {Uint8Array} arr the array to split
 * @param {Number} len the number of bytes per section
 */
export function splitArray(arr, len) {
	const segments = Math.floor(arr.length / len);
	let ret = [];

	for (let i = 0; i < segments; i++)
		ret.push(arr.slice(len * i, len));

	return ret;
}

export function compareVersions(ver1, ver2) {
	const v1 = ver1.match(/[0-9]+\.[0-9]+\.[0-9]+/)[0].split('.'),
		v2 = ver2.match(/[0-9]+\.[0-9]+\.[0-9]+/)[0].split('.'),
		l = v1.length > v2.length ? v2.length : v1.length;

	for (let i = 0; i < l; i++) {
		const a = parseInt(v1[i], 10),
			b = parseInt(v2[i], 10);

		if (a < b)
			return -1;
		else if (a > b)
			return 1;
	}

	return 0;
}

let timeouts = {};

export function debounce(fn, delay) {
	return () => {
		if (timeouts[fn])
			clearTimeout(timeouts[fn]);

		let args = arguments,
			that = this;

		timeouts[fn] = setTimeout(() => {
			fn.apply(that, args);
			timeouts[fn] = null;
		}, delay);
	};
}

export function blobToDataURI(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onerror = reject;
		reader.onload = (e) => resolve(reader.result);

		reader.readAsDataURL(blob);
	});
}

export function sleep(n) {
	return new Promise((resolve) => {
		setTimeout(resolve, n);
	});
}

export function verifyAddress(addr) {
	return addr.length === 76 || addr.length === 64;
}