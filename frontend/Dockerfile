#FROM node:alpine as build
#COPY package.json package.json
#RUN npm install
#COPY . .
#RUN npm run build

#FROM nginx:stable-alpine

#COPY --from=build ./.next/standalone /usr/share/nginx/html
#COPY --from=build ./.next/static /usr/share/nginx/html/_next/static
#
##COPY --from=build /dist /usr/share/nginx/html
#COPY --from=build nginx.conf /etc/nginx/conf.d/default.conf
#EXPOSE 3000
#CMD [ "nginx", "-g", "daemon off;" ]


# Этап сборки
# Этап сборки
# Фронтенд/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]