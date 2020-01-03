const path = require('path');

module.exports = {
	parallel: false,
	pwa: {
		name: 'Sia Lite Wallet',
		themeColor: '#1d1e21',
		msTileColor: '#1d1e21',
		appleMobileWebAppCapable: 'yes',
		appleMobileWebAppStatusBarStyle: 'black-translucent',
		manifestOptions: {
			background_color: '#1d1e21'
		}
	},
	chainWebpack: config => {
		config.output.publicPath = `${process.cwd()}/dist/`;

		const svgRule = config.module.rule('svg');
		const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];

		svgRule.uses.clear();
		svgRule
			.use('vue-svg-loader')
			.loader('vue-svg-loader')
			.options({
				svgo: false
			});

		config.module.rule('worker')
			.test(/\.worker\.js$/i)
			.use('worker-loader')
			.loader('worker-loader');

		types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)));
	}
};

function addStyleResource(rule) {
	rule.use('style-resource')
		.loader('style-resources-loader')
		.options({
			patterns: [
				path.resolve(__dirname, './src/styles/vars.styl')
			]
		});
}
