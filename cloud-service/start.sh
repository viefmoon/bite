#!/bin/sh

echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la

# Verificar si dist existe
if [ ! -d "dist" ]; then
  echo "dist directory not found, building..."
  npm run build
fi

echo "Contents of dist directory:"
ls -la dist/

echo "Looking for main.js..."
MAIN_FILE=$(find dist -name "main.js" -type f | head -1)

if [ -n "$MAIN_FILE" ]; then
  echo "Found main.js at: $MAIN_FILE"
  echo "Starting application..."
  node "$MAIN_FILE"
else
  echo "ERROR: main.js not found in dist!"
  find dist -type f -name "*.js" | head -10
  exit 1
fi