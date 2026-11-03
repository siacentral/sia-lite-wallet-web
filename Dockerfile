# syntax=docker/dockerfile:1

# Go toolchain
FROM golang AS buildgo

FROM node:25 AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm HUSKY=0 npm ci

# build web app
FROM node:25 AS buildnode

COPY --from=buildgo /usr/local/go /usr/local/go
ENV PATH="/usr/local/go/bin:${PATH}"

WORKDIR /app

COPY go.mod go.sum ./

RUN --mount=type=cache,target=/root/go/pkg/mod go mod download

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

RUN --mount=type=cache,target=/root/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    npm run build

# production
FROM n8maninger/vue-router

COPY --from=buildnode /app/dist /www
