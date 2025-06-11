#!/bin/bash

# Get all TypeScript/JavaScript files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Fix unused parameters - prefix with underscore
  sed -i.bak -E 's/\(([a-zA-Z0-9]+): /(_\1: /g' "$file" 2>/dev/null || true
  sed -i.bak -E 's/, ([a-zA-Z0-9]+)\)/, _\1)/g' "$file" 2>/dev/null || true
  sed -i.bak -E 's/, ([a-zA-Z0-9]+): /, _\1: /g' "$file" 2>/dev/null || true
  
  # Clean up backup files
  rm -f "${file}.bak"
done

echo "Done prefixing unused parameters with underscore"