# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy entire backend folder
COPY . .

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci

# Copy entire built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db-schema ./db-schema
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose port (will be overridden by docker-compose)
EXPOSE 3000

# Start the application
CMD ["node", "dist/src/main"]
