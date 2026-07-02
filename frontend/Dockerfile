FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=""
ARG VITE_ALLOW_GUEST_LOGIN="true"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ALLOW_GUEST_LOGIN=$VITE_ALLOW_GUEST_LOGIN

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
