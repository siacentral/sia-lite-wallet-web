## Sia Lite WASM

Simple GoLang WASM wrapper around some Sia wallet functions to access them securely in JS.

### Building

To build the WASM library 

```sh
GOARCH=wasm GOOS=js go build -o sia.wasm main.go
```