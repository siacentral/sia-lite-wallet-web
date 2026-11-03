Sia Central's Lite Wallet is a secure Siacoin (SC) wallet web app. This wallet has been tested and works with modern evergreen browsers: Chromium based browsers on Desktop, Safari on iOS, and Chrome on Android. Sensitive data, such as wallet seeds, is stored encrypted using a user-set passphrase and never leaves the device.

**[Sia Central Lite Wallet](https://wallet.siacentral.com)** | **[GitHub](https://github.com/siacentral/sia-lite-wallet-web)** | **[Container](https://github.com/siacentral/sia-lite-wallet-web/pkgs/container/sia-lite-wallet-web)**

### Main Features

+ **Secure** - Keep control of your seeds. All sensitive information is stored and encrypted locally, never leaving your device.
+ **No blockchain download** - Instantly create a new wallet. Recover an existing wallet in under 2 minutes.
+ **Ledger Nano** - Easily send and receive transactions with full Ledger Nano S and Ledger Nano X support
+ **Multiple Wallets** - Create any number of separate wallets. Easily track host or renter wallets and top them up from a Ledger wallet.
+ **Compatible** - Generate or recover wallets using 29 word seeds.
+ **Multilingual** - Supports English, Chinese and French. Additional languages can be easily added by the community.
+ **Multiplatform** - Works on modern desktop browsers, iOS and Android

### Supported Wallet Types

#### Seed Wallets
Seed wallets are created or recovered from a 29-word recovery phrase. These wallets are fully compatible with the official Sia wallet. The seed is encrypted and stored locally with a user provided unlock password. The seed never leaves the device, removing any risk of exposure.

#### Ledger Hardware Wallets
Ledger hardware wallets communicate using Ledger's secure transport. The seed cannot be retrieved from the Ledger device. Addresses are imported from the device to view balance and build transactions. The Ledger device is required to sign and confirm any transactions before being broadcast to the Sia network.

To enable Ledger support you need to be on a recent Chromium based desktop browser (Chrome, Brave, Opera, Microsoft Edge) and enable `Experimental Web Platform Features` from [chrome://flags/#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)

#### Watch-Only Wallets
Watch-Only wallets are read-only wallets used to monitor the balance of a group of addresses. Addresses to watch are imported manually to view balance.


### How It Works

This wallet uses a Sia wrapper that allows parts of Sia to be run directly in the browser. This lets the wallet generate, recover seeds, addresses, and sign transactions without using an external server or daemon. The wallet uses the Sia Central Explorer API to retrieve balance and transaction data without downloading the full blockchain.  All transaction generation and signing happens locally, the signed transaction is then broadcast to the network.

## Run Docker
```
docker run -p 80:80 -d ghcr.io/siacentral/sia-lite-wallet-web:latest
```

## Build Locally

### Prerequisites
+ Node 24+
+ NPM 10+
+ Go 1.26+

### Install dependencies
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

Use `npm run dev:testnet` to run with testnet WASM.

### Compiles and minifies for production
```
npm run build
```

Use `npm run build:testnet` for a testnet production build, or `npm run build:wasm` to build only WASM.

### Build Docker Image
```
npm run docker
```

### Lint and fixes files
```
npm run lint
```

Requires `golangci-lint` in addition to the prerequisites above. Use `npm run lint:js` or `npm run lint:go` to run either linter separately.

### Run tests
```
npm test
```

## Releases

Use [Knope](https://knope.tech/) to document changes that should appear in the next release:

```sh
knope document-change
```

Commit the generated `.changeset/*.md` file with the change. After it reaches `master`, automation creates or updates the `release` PR with a version bump and changelog. Merging that PR runs validation, publishes the versioned container image and `latest` to GHCR, and creates the Git tag and GitHub release. Ordinary `master` pushes publish development images tagged `master` and `sha-<commit>`.

The workflows use the built-in `GITHUB_TOKEN`; enable **Allow GitHub Actions to create and approve pull requests** in the repository's Actions settings. GitHub may require a maintainer to approve CI runs on the automatically created release PR. No Docker Hub credentials are needed.
