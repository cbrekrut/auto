FROM node:20-alpine AS build
WORKDIR /app

ENV CI=1

COPY package*.json ./
RUN npm ci

COPY . .
# Если деплоишь в корень домена, base в vite.config.js должен быть '/' или отсутствовать
# Если деплоишь под поддиректорией (например /auto/), оставь base: '/auto/'

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
