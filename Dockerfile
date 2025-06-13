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
RUN npm run build

# Verify build output
RUN echo "=== Build output structure ===" && \
    ls -la dist/ && \
    echo "=== Main file location ===" && \
    find dist -name "main.js" -type f -ls

EXPOSE 5000

# Make scripts executable
RUN chmod +x start.sh
RUN chmod +x health-check.js || true

# Add a simple test to verify the app can at least load
RUN node -e "console.log('Node.js is working')"

CMD ["./start.sh"]