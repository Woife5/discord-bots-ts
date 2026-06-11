# Multi-stage build: compile in a full Go image, run in a minimal scratch image.
# This produces a tiny final image (~10MB) with no OS, shell, or package manager.
FROM golang:1.26-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /copilot-bot .

# scratch is a completely empty base image — the Go binary is statically
# linked so it needs nothing else to run.
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /copilot-bot /copilot-bot

ENTRYPOINT ["/copilot-bot"]
