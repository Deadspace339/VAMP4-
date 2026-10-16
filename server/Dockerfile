# ===================================================
# SWAG INC. BACKEND DOCKERFILE
# Node.js Alpine lightweight runtime
# ===================================================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY index.js ./

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Expose backend API port
EXPOSE 3001

# Start server
CMD ["node", "index.js"]
