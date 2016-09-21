FROM node:4

WORKDIR /src

COPY package.json ./

RUN npm install --production

COPY *.js ./
COPY plugins ./plugins

EXPOSE 8080

ENV PORT 8080
ENV NODE_ENV production

CMD ["node", "server.js"]