ifeq "$(shell git status --porcelain=v1 2>/dev/null)" "" 
GIT_REVISION=$(shell git rev-parse --short HEAD)
BUILD_TIME=$(shell git show -s --format=%ci HEAD)
DOCKER_TAG=-t siacentral/sia-lite-wallet-web:latest
else
GIT_REVISION="$(shell git rev-parse --short HEAD)-devel"
BUILD_TIME=$(shell date)
endif

lint:
	GOOS=js GOARCH=wasm golangci-lint run
	npm run lint -- --fix

install-dependencies:
	npm i

build-wasm:
	cp "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" src/sia/wasm_exec.js
	GOARCH=wasm GOOS=js go build -trimpath -ldflags "-X 'github.com/siacentral/sia-lite-wallet-web/wasm/build.gitRevision=${GIT_REVISION}' -X 'github.com/siacentral/sia-lite-wallet-web/wasm/build.buildTime=${BUILD_TIME}' -buildid='' -s -w -extldflags '-static'" -o src/sia/sia.wasm wasm/main.go

build-wasm-testnet:
	cp "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" src/sia/wasm_exec.js
	GOARCH=wasm GOOS=js go build -trimpath -tags='testnet' -ldflags "-X 'github.com/siacentral/sia-lite-wallet-web/wasm/build.gitRevision=${GIT_REVISION}' -X 'github.com/siacentral/sia-lite-wallet-web/wasm/build.buildTime=${BUILD_TIME}' -buildid='' -s -w -extldflags '-static'" -o src/sia/sia.wasm wasm/main.go

build-vue:
	npm run build

run: install-dependencies build-wasm
	npm run serve

run-testnet: install-dependencies build-wasm-testnet
	npm run serve

build: install-dependencies build-wasm build-vue

build-testnet: install-dependencies build-wasm-testnet build-vue

docker:
	docker build ${DOCKER_TAG} -t siacentral/sia-lite-wallet-web:sia -t siacentral/sia-lite-wallet-web:$(GIT_REVISION) .