# build
FROM node:12 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# production
FROM n8maninger/vue-router

COPY --from=build /app/dist /usr/share/nginx/html