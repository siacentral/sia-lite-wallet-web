# Sia Lite

Sia Lite is a secure lite wallet implementation for web, desktop, and mobile. This wallet lets users send and receive Siacoin without syncing the blockchain.

## How it works

This wallet makes use of the Sia Central v2 API to retrieve balance and transaction data from the Sia blockchain. All transaction generation and signing happen locally on the device then the signed transaction is broadcast to the network.

## Wallet Types

### Regular Wallets

Regular Sia wallets are created or recovered from a 29 word recovery phrase. These wallets are fully compatible with the official Sia wallets. The seed is encrypted and stored locally using TweetNACL secretbox with a user provided unlock password. The seed never leaves the device removing any risk of exposure.

### Ledger Hardware Wallets

Hardware Wallets communicate using Ledger's WebHID transport interface. The seed cannot be retrieved from the Ledger device. Addresses are imported from the device, which allows for monitoring balance. The Ledger device is required to sign any transactions before being broadcast to the Sia network.

To enable Ledger support you need to be on a recent Chromium based browser and enable `Experimental Web Platform Features` from [chrome://flags/#enable-experimental-web-platform-features](chrome://flags/#enable-experimental-web-platform-features)

### Watch-Only Wallets

Watch-Only wallets cannot send transactions on the Sia network. They are read-only wallets. Addresses to watch are imported manually to monitor balance.

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