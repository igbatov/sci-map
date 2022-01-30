# build stage
FROM node:lts-alpine as build-stage
RUN apk add --update --no-cache python3 g++ make\
    && yarn \
    && apk del python3 g++ make
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn test:unit
RUN yarn build

# production-stage
FROM nginx:stable-alpine as production-stage
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
