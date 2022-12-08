# build wasm
FROM golang AS buildgo

WORKDIR /app

COPY . .

RUN make build-wasm

# build web app
FROM node:12 AS buildnode

WORKDIR /app

COPY --from=buildgo /app .

RUN npm install

ENV NODE_ENV=production
ARG SIACENTRAL_TOKEN=

RUN echo "\nVUE_APP_VERSION=$(git rev-parse --short HEAD)\nVUE_APP_SIACENTRAL_TOKEN=${SIACENTRAL_TOKEN}" >> .env
RUN npm run build

# production
FROM n8maninger/vue-router

COPY --from=buildnode /app/dist /www