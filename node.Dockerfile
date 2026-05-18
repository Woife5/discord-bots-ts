FROM node:26-alpine

ARG BOT_NAME

WORKDIR /usr/src

COPY ./${BOT_NAME}.cjs ./bot.cjs

ENTRYPOINT ["node", "./bot.cjs"]
