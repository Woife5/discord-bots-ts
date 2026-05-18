FROM node:26-alpine AS builder

RUN npm install -g pnpm@11.1.3

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src

# Copy workspace manifests and lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package manifests so pnpm can resolve the workspace
COPY shared/package.json ./shared/
COPY boller-bot/package.json ./boller-bot/

# Install all dependencies (including dev, needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY shared/ ./shared/
COPY boller-bot/ ./boller-bot/
COPY tsconfig.json ./

# Build
RUN pnpm --filter @woife5/boller-bot run build

ENTRYPOINT ["node", "./boller-bot/boller-bot.cjs"]
