ifeq "$(shell git status --porcelain=v1 2>/dev/null)" "" 
GIT_REVISION=$(shell git rev-parse --short HEAD)
DOCKER_TAG=-t siacentral/sia-lite-wallet-web:latest
else
GIT_REVISION="$(shell git rev-parse --short HEAD)-devel"
endif

lint:
	GOOS=js GOARCH=wasm golangci-lint run
	npm run lint -- --fix

clean:
	rm -rf dist public/sia/wasm_exec.js

build-dependencies:
	GOARCH=wasm GOOS=js go build -o sia.wasm wasm/main.go
	mkdir -p public/sia
	cp "${shell go env GOROOT}/misc/wasm/wasm_exec.js" public/sia
	npm i

run: clean build-dependencies
	npm run serve

build: clean build-dependencies
	npm run build

docker: clean
	docker build ${DOCKER_TAG} -t siacentral/sia-lite-wallet-web:sia -t siacentral/sia-lite-wallet-web:$(GIT_REVISION) .