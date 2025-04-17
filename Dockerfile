
FROM node:18-slim

WORKDIR /usr/src/app

# Copy only package files first, so layers cache
COPY package*.json ./

# Install prod deps only
RUN npm ci

# Copy the rest of your code
COPY . .

# Listen on our API port
EXPOSE 3000

# Launch detector, engine & API in one shot
CMD ["npm", "start"]