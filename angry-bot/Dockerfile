FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --production=true --frozen-lockfile

COPY . .

CMD [ "node", "./build/angry-bot" ]
