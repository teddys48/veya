# Multi-stage Dockerfile for Veya Music Player

# ============================================================
# Stage 1: Build React SPA frontend with Bun
# ============================================================
FROM oven/bun:latest AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/bun.lock* ./
RUN bun install

COPY frontend/ ./
RUN bun run build

# ============================================================
# Stage 2: Build Go backend binary
# ============================================================
FROM golang:alpine AS backend-builder

WORKDIR /app/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./

# Copy compiled frontend SPA from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./cmd/server/dist

RUN CGO_ENABLED=0 GOOS=linux \
    go build \
    -ldflags="-s -w" \
    -o server \
    ./cmd/server

# ============================================================
# Stage 3: Runtime
# ============================================================
FROM alpine:latest

RUN apk add --no-cache \
    ca-certificates \
    ffmpeg \
    tzdata \
    wget

WORKDIR /app

# Create non-root user and directories
RUN addgroup -S veya \
    && adduser -S veya -G veya \
    && mkdir -p /data/covers /music \
    && chown -R veya:veya /app /data

COPY --from=backend-builder /app/backend/server ./server

USER veya

EXPOSE 8080

ENV PORT=8080 \
    DB_PATH=/data/veya.db \
    MUSIC_DIR=/music \
    COVERS_DIR=/data/covers \
    LOG_LEVEL=info \
    ENV=production

HEALTHCHECK --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD wget --no-verbose --tries=1 --spider \
        http://localhost:8080/api/health || exit 1

ENTRYPOINT ["./server"]