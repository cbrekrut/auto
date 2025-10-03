# ---------- 1) Сборка фронтенда ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; fi

COPY . .

# Собираем (поддерживаем и Vite, и CRA)
RUN npm run build || true

# Нормализуем результат: всё складываем в /app/out
RUN set -eux; \
    if [ -d dist ]; then mv dist out; \
    elif [ -d build ]; then mv build out; \
    else echo "ERROR: build output not found (expected dist/ or build/)"; ls -la; exit 1; fi

# ---------- 2) Рантайм с Nginx ----------
FROM nginx:1.27-alpine AS runtime

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Копируем только нормализованный артефакт
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
