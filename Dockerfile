# build wasm
FROM golang:1.13-alpine AS buildgo

WORKDIR /app

COPY ./wasm .

RUN GOARCH=wasm GOOS=js go get
RUN GOARCH=wasm GOOS=js go build -o sia.wasm main.go
RUN cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" /app

# build web app
FROM node:12 AS buildnode

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# production
FROM n8maninger/vue-router

COPY --from=buildnode /app/dist /usr/share/nginx/html
COPY --from=buildgo /app/sia.wasm /usr/share/nginx/html/sia
COPY --from=buildgo /app/wasm_exec.js /usr/share/nginx/html/sia