FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /app
#COPY --from=builder /app/.next /usr/share/nginx/html
COPY --from=builder /app/out /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
#COPY --from=builder /app/staticfiles /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;" ]