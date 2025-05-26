FROM oven/bun:alpine

WORKDIR /usr/src

# Install dependencies
RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

COPY ./boller-bot.js ./boller-bot.js

ENTRYPOINT [ "bun", "./boller-bot.js" ]
