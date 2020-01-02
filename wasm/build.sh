cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ../public/sia
GOARCH=wasm GOOS=js go build -o ../public/sia/sia.wasm main.go
