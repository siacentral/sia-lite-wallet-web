The Sia Central Lite Wallet is a secure Siacoin lite wallet implementation for web. This wallet has been tested and works with Chromium based browsers on Desktop, iOS Safari or Chrome, and Chrome on Android. Desktop and mobile apps will be coming soon. Sensitive data, such as wallet seeds, is stored encrypted using a user-set passphrase and never leaves the device.

**[Sia Central Lite Wallet](https://wallet.siacentral.com)** | **[GitHub](https://github.com/siacentral/sia-lite-wallet-web)** | **[Docker](https://hub.docker.com/r/siacentral/sia-lite-wallet-web)**

### Main Features

+ **Secure** - Keep control of your seeds. All sensitive information is stored and encrypted locally, never leaving your device.
+ **No blockchain download** - Instantly create a new wallet. Recover an existing wallet in under 2 minutes.
+ **Ledger Nano S** - The first Sia wallet with Ledger Nano S support.
+ **Multiple Wallets** - Create any number of separate wallets. Easily track host or renter wallets and top them up from a Ledger wallet.
+ **Compatible** - Fully compatible with the official Sia wallets. Recover wallets using 29 word Sia seeds.
+ **Multilingual** - Supports English, Chinese and French. Additional languages can be easily added by the community.
+ **Multiplatform** - Works on modern desktop browsers, iOS and Android

### Supported Wallet Types

#### 29-word Sia Seeds
Regular Sia wallets are created or recovered from a 29 word recovery phrase. These wallets are fully compatible with the official Sia wallet. The seed is encrypted and stored locally with a user provided unlock password. The seed never leaves the device, removing any risk of exposure.

#### Ledger Hardware Wallets
Ledger hardware wallets communicate using Ledger's secure transport. The seed cannot be retrieved from the Ledger device. Addresses are imported from the device to view balance and build transactions. The Ledger device is required to sign and confirm any transactions before being broadcast to the Sia network.

To enable Ledger support you need to be on a recent Chromium based browser (Chrome, Brave, Opera) and enable `Experimental Web Platform Features` from [chrome://flags/#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)

#### Watch-Only Wallets
Watch-Only wallets cannot send transactions on the Sia network. They are read-only wallets. Addresses to watch are imported manually to view balance.


### How It Works

This wallet uses a Sia wrapper that allows parts of Sia to be run directly in the browser. This lets the wallet generate, recover seeds, addresses, and sign transactions without using an external server or daemon. The wallet uses the Sia Central Explorer API to retrieve balance and transaction data without downloading the full blockchain.  All transaction generation and signing happens locally, the signed transaction is then broadcast to the network.

## Docker
```
docker run -p 80:80 -d siacentral/sia-central-lite-wallet
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```