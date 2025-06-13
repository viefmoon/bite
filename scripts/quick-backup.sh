#!/bin/bash

# Script rápido para backup con un solo comando
# Uso: ./scripts/quick-backup.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Backup rápido a Railway${NC}"

# Cargar variables
source backend/.env

if [ -z "$RAILWAY_DATABASE_URL" ]; then
    echo "Error: Agrega RAILWAY_DATABASE_URL a tu backend/.env"
    exit 1
fi

# Hacer backup directo con pipe (más rápido, sin archivo temporal)
echo "Clonando base de datos..."
pg_dump "$DATABASE_URL" --clean --no-acl --no-owner --if-exists | psql "$RAILWAY_DATABASE_URL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup completado exitosamente${NC}"
    
    # Mostrar estadísticas
    echo -e "\n📊 Tablas respaldadas:"
    psql "$RAILWAY_DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
else
    echo "✗ Error en el backup"
    exit 1
fi