# Dockerfile
# ─────────────────────────────────────────────────────────────

# 1. Use April 2025’s Node LTS (v20) on slim for minimal footprint
FROM node:20-slim

# 2. Make /usr/src/app your working dir
WORKDIR /usr/src/app

# 3. Copy only the manifest files first (so changes to code don’t bust the npm cache)
COPY package.json package-lock.json ./

# 4. Install production deps only
RUN npm ci --omit=dev

# 5. Copy the rest of your source
COPY . .

# 6. Expose your API port
EXPOSE 3000

# 7. Launch detector, engine & API
CMD ["npm", "start"]
