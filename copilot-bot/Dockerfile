FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o copilot-bot .

FROM alpine:latest

RUN apk add --no-cache ca-certificates
COPY --from=builder /app/copilot-bot /copilot-bot

ENTRYPOINT ["/copilot-bot"]
