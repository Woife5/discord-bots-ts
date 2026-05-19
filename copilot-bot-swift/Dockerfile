# Stage 1: Build
FROM swift:6.0-jammy AS builder

WORKDIR /app

COPY Package.swift Package.resolved* ./
RUN swift package resolve

COPY Sources ./Sources
RUN swift build -c release --static-swift-stdlib

# Stage 2: Run
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y ca-certificates libstdc++6 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.build/release/CopilotBot /copilot-bot

ENTRYPOINT ["/copilot-bot"]
