import { BigNumber } from 'bignumber.js';

function getUnit(str, mul, units, def) {
	const unit = str.replace(/[^a-z]/gi, '').trim().toLowerCase(),
		idx = units.map(u => u.toLowerCase()).indexOf(unit);

	if (idx === -1)
		return Math.pow(mul, def || 1);

	return Math.pow(mul, idx);
}

export function parseNumberString(str, mul, units, def) {
	const decimalSep = (1.1).toLocaleString().substring(1, 2),
		repRegex = new RegExp(`[^0-9${decimalSep}]`, 'g');

	let num = new BigNumber(str.replace(repRegex, '').replace(decimalSep, '.'), 10);

	if (num.isNaN() || !num.isFinite())
		num = new BigNumber(0);

	if (!units || !Array.isArray(units))
		units = [];

	return num.times(getUnit(str, mul, units, def));
};

export function parseBlockTimeString(str) {
	/* eslint-disable object-property-newline */
	const multipliers = {
		m: 4320, w: 1008, d: 144, h: 6,
		mth: 4320, mths: 4320,
		mon: 4320, wk: 1008, dy: 144, hr: 6,
		month: 4320, week: 1008, day: 144, hour: 6,
		months: 4320, weeks: 1008, days: 144, hours: 6
	};

	const unit = str.replace(/[^a-z]/gi, ''),
		num = parseInt(str.replace(/[^0-9]/g, ''), 10);

	if (!multipliers[unit])
		throw new Error(`${unit} not recognized`);

	return Math.floor(num * multipliers[unit]);
}

export function parseSiacoinString(str) {
	return parseNumberString(str, 1000, ['pSC', 'nSC', 'uSC', 'mSC', 'SC', 'KSC', 'MSC', 'GSC', 'TSC'], 4).times(1e12);
}

export function parseCurrencyString(str, rate) {
	if (rate)
		return parseNumberString(str, 1).div(rate).times(1e24);

	return parseSiacoinString(str);
}

export function parseByteString(str) {
	try {
		return parseNumberString(str, 1000, ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']);
	} catch (ex) {}

	return parseNumberString(str, 1024, ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']);
};