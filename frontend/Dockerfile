# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy frontend package.json and install dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install && npm cache clean --force

# Copy frontend source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Copy built frontend from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
