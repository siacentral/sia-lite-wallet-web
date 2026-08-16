# build wasm
FROM golang AS buildgo

WORKDIR /app

COPY . .

RUN make build-wasm

# build web app
FROM node:24 AS buildnode

WORKDIR /app

COPY --from=buildgo /app .

RUN npm install

ENV NODE_ENV=production

RUN npm run build

# production
FROM n8maninger/vue-router

COPY --from=buildnode /app/dist /www