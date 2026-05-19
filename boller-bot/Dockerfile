# syntax=docker/dockerfile:1

# ── xx cross-compilation helper ───────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM tonistiigi/xx AS xx

# ── builder (always runs on native amd64 in CI) ───────────────────────────────
FROM --platform=$BUILDPLATFORM golang:1.24-bookworm AS builder

COPY --from=xx / /

# Host-side tools needed for CGo cross-compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    lld \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Download dependencies first (better layer caching)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Target platform arg is injected by buildx
ARG TARGETPLATFORM

# Install libopus-dev for the TARGET architecture (arm64).
# xx-apt-get handles the multi-arch apt setup automatically.
RUN xx-apt-get install -y --no-install-recommends \
    libopus-dev \
    gcc \
    libc6-dev

# xx-go sets GOOS, GOARCH, CGO_ENABLED=1, CC, and PKG_CONFIG* automatically.
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=1 xx-go build -ldflags="-s -w" -o /out/bollerbot .

# Verify the binary targets the correct architecture
RUN xx-verify /out/bollerbot

# ── runtime (runs on the target arm64 machine) ────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libopus0 \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/bollerbot /bollerbot

ENTRYPOINT ["/bollerbot"]
