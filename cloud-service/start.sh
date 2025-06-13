#!/bin/sh

echo "=== Starting Cloud Service ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV:-development}"

# Verificar variables críticas
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set!"
fi

# Verificar si dist existe
if [ ! -d "dist" ]; then
  echo "dist directory not found, building..."
  npm run build
fi

echo -e "\n=== Checking dist structure ==="
ls -la dist/

# La ruta correcta generada por NestJS
MAIN_FILE="dist/cloud-service/src/main.js"

if [ -f "$MAIN_FILE" ]; then
  echo -e "\n=== Starting application from: $MAIN_FILE ==="
  # Ejecutar con manejo de errores mejorado
  exec node "$MAIN_FILE"
else
  echo "ERROR: main.js not found at expected location: $MAIN_FILE"
  echo "All .js files found:"
  find dist -type f -name "*.js"
  exit 1
fi