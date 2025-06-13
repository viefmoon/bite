FROM node:18-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies
RUN npm install

# Build cloud-service
WORKDIR /app/cloud-service
RUN npm run build

# Verify build output
RUN ls -la dist/

EXPOSE 5000

# Make start script executable
RUN chmod +x start.sh

CMD ["./start.sh"]