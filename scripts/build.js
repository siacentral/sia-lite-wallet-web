import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

try {
	const [target, ...flags] = process.argv.slice(2),
		testnet = flags.length === 1 && flags[0] === '--testnet';

	if (!['wasm', 'docker'].includes(target) || (flags.length > 0 && !(target === 'wasm' && testnet)))
		throw new Error('Usage: node scripts/build.js wasm [--testnet] | docker');

	let revision = 'devel',
		buildTime = new Date().toISOString(),
		clean = false;

	if (existsSync('.git')) {
		clean = execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' }).trim() === '';
		revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
		if (clean)
			buildTime = execFileSync('git', ['show', '-s', '--format=%ci', 'HEAD'], { encoding: 'utf8' }).trim();
		else
			revision += '-devel';
	}

	if (target === 'wasm') {
		const goroot = execFileSync('go', ['env', 'GOROOT'], { encoding: 'utf8' }).trim(),
			buildPackage = 'github.com/siacentral/sia-lite-wallet-web/wasm/build',
			args = ['build', '-trimpath'];

		copyFileSync(join(goroot, 'lib', 'wasm', 'wasm_exec.js'), 'src/sia/wasm_exec.js');
		if (testnet)
			args.push('-tags=testnet');

		args.push(
			'-ldflags', `-X '${buildPackage}.gitRevision=${revision}' -X '${buildPackage}.buildTime=${buildTime}' -buildid='' -s -w -extldflags '-static'`,
			'-o', 'src/sia/sia.wasm', 'wasm/main.go'
		);
		execFileSync('go', args, {
			env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
			stdio: 'inherit'
		});
	} else {
		const image = 'ghcr.io/siacentral/sia-lite-wallet-web',
			args = ['build', '-t', `${image}:sia`, '-t', `${image}:${revision}`];

		if (clean)
			args.push('-t', `${image}:latest`);

		args.push('.');
		execFileSync('docker', args, { stdio: 'inherit' });
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = error.status || 1;
}
