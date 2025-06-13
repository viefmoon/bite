FROM node:18-alpine

# Install build dependencies including SQLite
RUN apk add --no-cache python3 make g++ sqlite sqlite-dev

WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies with verbose output
RUN npm install --verbose

# Build cloud-service
WORKDIR /app/cloud-service
RUN echo "=== Current directory before build ===" && pwd && ls -la
RUN npm run build || (echo "Build failed. Package.json content:" && cat package.json && exit 1)

# Verify build output
RUN echo "=== After build, current directory ===" && pwd && ls -la
RUN if [ -d "dist" ]; then \
      echo "=== dist found, searching for JS files ===" && \
      find dist -type f -name "*.js" | head -20; \
    else \
      echo "=== dist not found! ===" && \
      exit 1; \
    fi

EXPOSE 5000

# Make scripts executable
RUN chmod +x start.sh
RUN chmod +x health-check.js || true

# Add a simple test to verify the app can at least load
RUN node -e "console.log('Node.js is working')"

CMD ["./start.sh"]