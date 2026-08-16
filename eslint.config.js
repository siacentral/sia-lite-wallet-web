import pluginVue from 'eslint-plugin-vue';

export default [
	{
		ignores: ['dist/**', 'public/**', 'wasm/**', '**/wasm_exec.js', '**/sia.worker.js']
	},
	...pluginVue.configs['flat/essential'],
	{
		files: ['**/*.{js,vue}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				__static: 'readonly'
			}
		},
		rules: {
			'vue/multi-word-component-names': 'off',
			'generator-star-spacing': 'off',
			'no-tabs': 'off',
			'indent': ['error', 'tab'],
			'space-before-function-paren': ['error', 'never'],
			'semi': ['error', 'always'],
			'eol-last': 'off',
			'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
			'one-var': 'off',
			'curly': ['error', 'multi-or-nest']
		}
	}
];
