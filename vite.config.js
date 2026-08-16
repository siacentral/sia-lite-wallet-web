import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

function gitRevision() {
	try {
		const rev = execSync('git rev-parse --short HEAD').toString().trim(),
			dirty = execSync('git status --porcelain -uno').toString().trim().length > 0;

		return dirty ? `${rev}-devel` : rev;
	} catch {
		return 'devel';
	}
}

const varsPath = fileURLToPath(new URL('./src/styles/vars.styl', import.meta.url));

// adds integrity attributes to the assets referenced from index.html and an
// import map integrity section covering every emitted JS chunk, hashing the
// files as written to disk. The import map lets supporting browsers verify
// dynamically imported route chunks; others ignore it. Dynamically injected
// route stylesheets have no integrity mechanism and are not covered.
function sri() {
	return {
		name: 'sri',
		apply: 'build',
		enforce: 'post',
		async writeBundle(options) {
			const dir = options.dir ?? 'dist',
				htmlPath = join(dir, 'index.html');

			let html;
			try {
				html = await readFile(htmlPath, 'utf8');
			} catch {
				return;
			}

			for (const [tag, name, attrs] of [...html.matchAll(/<(script|link)([^>]*?)\s*\/?>/g)]) {
				const ref = attrs.match(/(?:src|href)="\/(assets\/[^"]+)"/);
				if (!ref)
					continue;

				const hash = createHash('sha384').update(await readFile(join(dir, ref[1]))).digest('base64'),
					crossorigin = /crossorigin/.test(attrs) ? '' : ' crossorigin="anonymous"';

				html = html.replace(tag, `<${name}${attrs} integrity="sha384-${hash}"${crossorigin}>`);
			}

			const integrity = {};
			for (const file of await readdir(join(dir, 'assets'))) {
				if (!file.endsWith('.js'))
					continue;

				const hash = createHash('sha384').update(await readFile(join(dir, 'assets', file))).digest('base64');
				integrity[`/assets/${file}`] = `sha384-${hash}`;
			}
			html = html.replace('<script type="module"', `<script type="importmap">${JSON.stringify({ integrity })}</script><script type="module"`);

			await writeFile(htmlPath, html);
		}
	};
}

export default defineConfig({
	base: '/',
	build: {
		target: 'es2020'
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		},
		// the codebase imports .vue components without their extension
		extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
	},
	define: {
		// nodePolyfills doesn't inject into the worker bundle, and the WASM
		// worker + Go runtime reference a Node-style `global`
		global: 'globalThis',
		'process.platform': JSON.stringify('browser'),
		'process.env.VUE_APP_VERSION': JSON.stringify(gitRevision())
	},
	worker: {
		format: 'es'
	},
	css: {
		preprocessorOptions: {
			stylus: {
				additionalData: `@import "${varsPath}"\n`
			}
		}
	},
	plugins: [
		vue(),
		svgLoader(),
		sri(),
		// the @ledgerhq transports reference a bare `Buffer` global (and some
		// deps reference `process`) that webpack used to polyfill automatically
		nodePolyfills({
			include: ['buffer', 'process'],
			globals: { Buffer: true, process: true, global: false }
		})
	]
});
