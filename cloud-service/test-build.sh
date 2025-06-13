#!/bin/bash

echo "=== Testing NestJS build locally ==="

# Limpiar build anterior
rm -rf dist/

# Construir
echo "Building..."
npm run build

# Verificar resultado
echo -e "\n=== Build output structure ==="
find dist -name "*.js" | head -20

echo -e "\n=== Looking for main.js ==="
MAIN_FILE=$(find dist -name "main.js" -type f | head -1)

if [ -n "$MAIN_FILE" ]; then
  echo "✓ Found main.js at: $MAIN_FILE"
  echo "✓ Build successful!"
else
  echo "✗ ERROR: main.js not found!"
  exit 1
fi