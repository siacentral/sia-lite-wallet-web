import en from './languages/en.json';
import cn from './languages/cn.json';
import fr from './languages/fr.json';

const supportedLanguages = [
		en, cn, fr
	],
	translations = {};

function loadTranslations() {
	supportedLanguages.forEach(l => {
		if (translations[l.key])
			return;

		translations[l.key] = l.translations;

		languages.push(l.key);
	});
}

export const languages = [];

export function languageSupported(language) {
	return !!(translations[language]);
}

export function translate(id, language) {
	const params = Array.from(arguments).slice(2);
	let group;

	if (!translations[language])
		throw new Error(`unknown language ${language}`);

	if (typeof id !== 'string')
		throw new Error(`expected string for id not ${typeof id}`);

	id = id.split('.');
	group = translations[language];

	for (let i = 0; i < id.length; i++) {
		group = group[id[i]];

		if (!group)
			break;
	}

	if (!group) {
		if (language !== 'en') {
			const args = Array.from(arguments);

			args[1] = 'en';

			return translate.apply(this, args);
		}

		throw new Error(`unknown translation for ${id.join(', ')}`);
	}

	return group.replace(/\{\{[0-9]+\}\}/gm, (s) => {
		const i = parseInt(s.substring(2, s.length - 2), 10),
			sub = params[i];

		return sub !== null && sub.toString ? sub.toString() : '';
	});
}

loadTranslations();