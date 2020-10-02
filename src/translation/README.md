# Translation

The lite wallet makes every attempt at being internationally accessible, this includes a very simple UI translation. If your language has specific needs not supported by the existing language file please create an issue.

## Adding a new language

1. Create a new branch for your language
2. Copy the `languages/en.json` file
3. Rename it with the [ISO-639-1](https://en.wikipedia.org/wiki/ISO_639-1) language code you would like to translate
4. Update all key value pairs with your translation. Double brackets like `{{0}}` indicates a placeholder. These are mostly used for counters and should stay the same regardless of language.

## Updating an existing language

### Adjusting a translation

To adjust a translation, just edit the corresponding value in the language file.

### Missing keys

If you are not seeing a translation most likely a key is missing. Copy the exact key from the `languages/en.json` file