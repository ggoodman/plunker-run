FROM mhart/alpine-node:4

WORKDIR /src

COPY package.json ./

RUN apk add --no-cache git make gcc g++ python && \
    npm install && \
    apk del git make gcc g++ python && \
    rm -rf /etc/ssl /usr/share/man /tmp/* /var/cache/apk/* \
        /root/.npm /root/.node-gyp /root/.gnupg

COPY *.js ./
COPY plugins ./plugins

EXPOSE 8080
ENV PORT 8080

CMD ["node", "server.js"]