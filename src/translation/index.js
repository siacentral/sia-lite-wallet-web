import en from './languages/en.js';

const supportedLanguages = [
		en
	],
	translations = {};

function loadTranslations() {
	supportedLanguages.forEach(l => {
		if (translations[l.key])
			return;

		translations[l.key] = l.translations;

		languages.push(l.key);
	});

	console.log(languages);
}

export const languages = [];

export function languageSupported(language) {
	return !!(translations[language]);
}

export function translate(id, language) {
	let group, params = Array.from(arguments).slice(2);

	if (!translations[language])
		throw new Error(`unknown language ${language}`);

	id = id.split('.');
	group = translations[language];

	for (let i = 0; i < id.length; i++)
		group = group[id[i]];

	if (!group && language !== 'en')
		return translate(id, 'en');

	if (!group)
		throw new Error(`unknown translation for ${id.join(', ')}`);

	return group.replace(/\{\{[0-9]+\}\}/gm, (s) => {
		const i = parseInt(s.substring(2, s.length - 2), 10),
			sub = params[i];

		return sub ? sub.toString() : s;
	});
}

loadTranslations();