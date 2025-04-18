# Stage 1: Install production deps
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Copy code & run as non‑root
FROM node:18-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser
WORKDIR /home/appuser/app

# Bring in only prod deps
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy source
COPY --chown=appuser:appgroup . .

# Expose API port
ARG API_PORT=3000
ENV API_PORT=${API_PORT}
EXPOSE ${API_PORT}

# Start everything
CMD ["npm","start"]
