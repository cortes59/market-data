# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package first
COPY shared/ ./shared/

# Copy backend package.json and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install && npm cache clean --force

# Copy backend source code
COPY backend/ ./

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json first for production dependencies
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --production && npm cache clean --force

# Copy shared package
COPY --from=builder /app/shared ../shared

# Copy built backend
COPY --from=builder /app/backend/dist ./dist

# Set environment to production
ENV NODE_ENV=production

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/backend/src/main.js"]
