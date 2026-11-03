## Sia Lite WASM

Simple GoLang WASM wrapper around some Sia wallet functions to access them securely in JS.

### Building

To build the WASM library from the repository root

```sh
npm run build:wasm
```

Use `npm run build:wasm:testnet` for testnet. Both commands also copy the matching Go WASM runtime into `src/sia/wasm_exec.js`.
