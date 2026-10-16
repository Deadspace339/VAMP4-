# ===================================================
# SWAG INC. FRONTEND DOCKERFILE
# Multi-stage: Node.js build + Nginx Alpine static server
# ===================================================

# Stage 1: Build Vite / React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies needed for build
RUN npm install

# Copy frontend source files
COPY . ./

# Build optimized production bundle
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy for /api
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
