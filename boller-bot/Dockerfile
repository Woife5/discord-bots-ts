# ------------------
# Builder
# ------------------
FROM debian:bookworm AS builder

WORKDIR /usr/src

# Install Bun
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    ca-certificates \
 && curl -fsSL https://bun.sh/install | bash \
 && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Install Node 20 (needed for discord/opus)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y \
    nodejs \
    python3 \
    make \
    g++ \
 && rm -rf /var/lib/apt/lists/*

# Copy source
COPY . .

# Install dependencies
# Will invoke node20 to install some discord opus native stuff
RUN bun install

# Build your bot
RUN cd boller-bot && bun run build

# ------------------
# Runtime
# ------------------
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Runtime-only deps
RUN apt-get update && apt-get install -y \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Copy built binary/artifacts
COPY --from=builder /usr/src/boller-bot/bollerbot ./bollerbot

# Ensure executable bit (safe even if already set)
RUN chmod +x ./bollerbot

ENTRYPOINT ["./bollerbot"]

