const base = require('../languages/en.json'),
	path = require('path'),
	fs = require('fs');

if (process.argv.length !== 3)
	throw new Error('invalid usage: requires language code');

const languagePath = path.resolve(path.dirname(process.argv[1]), `../languages/${process.argv[2]}.json`),
	language = require(languagePath);

function matchKeys(a, b) {
	const keys = Object.keys(a),
		v = {};

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];

		if (key === 'language')
			continue;

		if (typeof b[key] === 'string')
			v[key] = b[key];
		else if (typeof b[key] === 'object')
			v[key] = matchKeys(a[key], b[key]);
		else
			v[key] = a[key];
	}

	return v;
}

const updated = matchKeys(base, language);

fs.writeFileSync(languagePath, JSON.stringify(updated, null, '\t'));