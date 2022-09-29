FROM --platform=arm64 node:18-alpine

WORKDIR /usr/src

COPY ./angry-bot/package.json ./
COPY ./yarn.lock ./

RUN yarn install --production=true --frozen-lockfile

COPY ./angry-bot/index.js ./angry-bot/index.js

CMD [ "node", "./angry-bot/index.js" ]
