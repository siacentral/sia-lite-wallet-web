# build wasm
FROM golang:1.13-alpine AS buildgo

RUN echo "Install Build Tools" && apk update && apk upgrade && apk add --no-cache gcc musl-dev openssl git

WORKDIR /app

COPY . .

RUN GOARCH=wasm GOOS=js go build -o sia.wasm wasm/main.go
RUN cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" /app

# build web app
FROM node:12 AS buildnode

ARG TRANSAK_API_KEY

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN VUE_APP_TRANSAK_KEY=$TRANSAK_API_KEY npm run build

# production
FROM n8maninger/vue-router

COPY --from=buildnode /app/dist /usr/share/nginx/html
COPY --from=buildgo /app/sia.wasm /usr/share/nginx/html/sia
COPY --from=buildgo /app/wasm_exec.js /usr/share/nginx/html/sia