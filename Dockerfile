# ─── Stage 1: Dependency install ─────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy only package manifests to leverage Docker layer caching
COPY package*.json ./

# Install only production deps
RUN npm ci --only=production

# ─── Stage 2: Build minimal runtime image ────────────────────
FROM node:18-alpine

# Create non‑root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /home/appuser/app

# Copy over node_modules from builder
COPY --chown=appuser:appgroup --from=builder /usr/src/app/node_modules ./node_modules

# Copy rest of the source
COPY --chown=appuser:appgroup . .

# Expose your API port
ARG API_PORT=3000
ENV API_PORT=${API_PORT}
EXPOSE ${API_PORT}

# Start detector, engine & API together
CMD ["npm","start"]
