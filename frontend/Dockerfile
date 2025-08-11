  GNU nano 4.8                                                        frontend/Dockerfile                                                                   FROM node:alpine as build

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=build ./.next/standalone /usr/share/nginx/html
COPY --from=build ./.next/static /usr/share/nginx/html/_next/static
#COPY --from=build /dist /usr/share/nginx/html
COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]