const path = require('path'),
	WorkerPlugin = require('worker-plugin');

module.exports = {
	parallel: false,
	crossorigin: 'anonymous',
	integrity: true,
	pwa: {
		name: 'Sia Lite Wallet',
		themeColor: '#1d1e21',
		msTileColor: '#1d1e21',
		appleMobileWebAppCapable: 'yes',
		appleMobileWebAppStatusBarStyle: 'black-translucent',
		manifestOptions: {
			background_color: '#1d1e21',
			skylink: 'AQD-AsRr6-cB_xKegTR_7d0Dtzh73VPR08MGiEZgQ7Edxw'
		}
	},
	configureWebpack: {
		plugins: [
			new WorkerPlugin()
		],
		optimization: {
			splitChunks: {
				chunks: 'all',
				maxInitialRequests: Infinity,
				maxSize: 200000,
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name(module) {
							const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
							return `npm.${packageName.replace('@', '')}`;
						}
					}
				}
			}
		},
		module: {
			rules: [
				{
					test: /\.wasm$/,
					loader: 'file-loader',
					type: 'javascript/auto',
					options: {
						name: '[name].[contenthash].[ext]'
					}
				}
			]
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

		types.forEach(type => addStyleResource(config.module.rule('stylus').oneOf(type)));

		/*
		Disable (or customize) prefetch, see:
		https://cli.vuejs.org/guide/html-and-static-assets.html#prefetch
		*/
		config.plugins.delete('prefetch');

		/*
		Configure preload to load all chunks
		NOTE: use `allChunks` instead of `all` (deprecated)
		*/
		config.plugin('preload').tap((options) => {
			options[0].include = 'allChunks';
			return options;
		});
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
