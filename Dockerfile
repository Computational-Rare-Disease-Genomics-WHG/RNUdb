# Use Node.js to build the app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Serve the app with a lightweight HTTP server (no Nginx needed)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist

# Install `serve` to host static files
RUN yarn global add serve

# Expose port (default: 3000)
EXPOSE 3000

# Start the server
CMD ["serve", "-s", "dist", "-l", "3000"]
