#!/bin/bash

echo "🧹 Limpiando proyecto React Native..."

# Detener Metro bundler
echo "Deteniendo Metro bundler..."
pkill -f "react-native.*metro" || true

# Limpiar watchman
echo "Limpiando watchman..."
watchman watch-del-all 2>/dev/null || true

# Limpiar caches de React Native
echo "Limpiando caches..."
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Limpiar node_modules y lock files
echo "Eliminando node_modules..."
rm -rf node_modules
rm -rf package-lock.json

# Limpiar caches de npm
echo "Limpiando cache de npm..."
npm cache clean --force

# Reinstalar dependencias
echo "Reinstalando dependencias..."
npm install

# Limpiar cache de Expo
echo "Limpiando cache de Expo..."
npx expo start --clear

echo "✅ Limpieza completa!"