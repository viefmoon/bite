#!/bin/bash

# Script para clonar/sincronizar base de datos local con Railway
# Uso: ./scripts/sync-database.sh [backup|restore|clone]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cargar variables de entorno
if [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: No se encontró backend/.env${NC}"
    exit 1
fi

# Verificar que tenemos las variables necesarias
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL no está definida${NC}"
    exit 1
fi

if [ -z "$RAILWAY_DATABASE_URL" ]; then
    echo -e "${RED}Error: RAILWAY_DATABASE_URL no está definida en backend/.env${NC}"
    echo -e "${YELLOW}Agrega esta línea a tu backend/.env:${NC}"
    echo "RAILWAY_DATABASE_URL=postgresql://usuario:password@host.railway.app:puerto/railway"
    exit 1
fi

# Función para clonar base de datos local a Railway (estructura + datos)
clone_to_railway() {
    echo -e "${YELLOW}⚡ Clonando base de datos local a Railway...${NC}"
    
    # Crear backup temporal
    BACKUP_FILE="/tmp/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    echo "📦 Exportando base de datos local..."
    pg_dump "$DATABASE_URL" --verbose --clean --no-acl --no-owner --if-exists > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Exportación completada${NC}"
        
        echo "📤 Importando a Railway..."
        psql "$RAILWAY_DATABASE_URL" < "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Base de datos clonada exitosamente a Railway${NC}"
            rm "$BACKUP_FILE"
        else
            echo -e "${RED}✗ Error al importar a Railway${NC}"
            echo -e "${YELLOW}Backup guardado en: $BACKUP_FILE${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Error al exportar base de datos local${NC}"
        exit 1
    fi
}

# Función para restaurar desde Railway a local
restore_from_railway() {
    echo -e "${YELLOW}⚡ Restaurando base de datos desde Railway...${NC}"
    echo -e "${RED}⚠️  ADVERTENCIA: Esto sobrescribirá tu base de datos local${NC}"
    read -p "¿Estás seguro? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        BACKUP_FILE="/tmp/railway_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        echo "📦 Exportando desde Railway..."
        pg_dump "$RAILWAY_DATABASE_URL" --verbose --clean --no-acl --no-owner --if-exists > "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Exportación completada${NC}"
            
            echo "📥 Importando a base de datos local..."
            psql "$DATABASE_URL" < "$BACKUP_FILE"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Base de datos restaurada exitosamente${NC}"
                rm "$BACKUP_FILE"
            else
                echo -e "${RED}✗ Error al importar a local${NC}"
                echo -e "${YELLOW}Backup guardado en: $BACKUP_FILE${NC}"
                exit 1
            fi
        else
            echo -e "${RED}✗ Error al exportar desde Railway${NC}"
            exit 1
        fi
    else
        echo "Operación cancelada"
    fi
}

# Función para hacer backup incremental (solo datos nuevos/modificados)
backup_data_only() {
    echo -e "${YELLOW}⚡ Respaldando solo datos a Railway...${NC}"
    
    BACKUP_FILE="/tmp/data_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    echo "📦 Exportando datos..."
    pg_dump "$DATABASE_URL" --data-only --verbose > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Exportación completada${NC}"
        
        # Primero limpiamos los datos en Railway (opcional)
        echo "🧹 Limpiando datos antiguos en Railway..."
        psql "$RAILWAY_DATABASE_URL" -c "TRUNCATE $(psql $DATABASE_URL -t -c "SELECT string_agg(tablename, ', ') FROM pg_tables WHERE schemaname = 'public'") CASCADE;"
        
        echo "📤 Importando datos a Railway..."
        psql "$RAILWAY_DATABASE_URL" < "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Datos respaldados exitosamente${NC}"
            rm "$BACKUP_FILE"
        else
            echo -e "${RED}✗ Error al importar datos${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Error al exportar datos${NC}"
        exit 1
    fi
}

# Función para verificar estado de ambas bases de datos
check_status() {
    echo -e "${YELLOW}📊 Estado de las bases de datos:${NC}"
    
    echo -e "\n${GREEN}Base de datos LOCAL:${NC}"
    psql "$DATABASE_URL" -c "SELECT current_database(), pg_database_size(current_database()) as size, (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as tables;"
    
    echo -e "\n${GREEN}Base de datos RAILWAY:${NC}"
    psql "$RAILWAY_DATABASE_URL" -c "SELECT current_database(), pg_database_size(current_database()) as size, (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as tables;"
}

# Menú principal
case "$1" in
    "clone")
        clone_to_railway
        ;;
    "restore")
        restore_from_railway
        ;;
    "backup")
        backup_data_only
        ;;
    "status")
        check_status
        ;;
    *)
        echo -e "${YELLOW}Uso: $0 [clone|restore|backup|status]${NC}"
        echo ""
        echo "Comandos:"
        echo "  clone    - Clona la base de datos local completa a Railway"
        echo "  restore  - Restaura la base de datos desde Railway a local"
        echo "  backup   - Respalda solo los datos (sin estructura)"
        echo "  status   - Muestra información de ambas bases de datos"
        echo ""
        echo -e "${YELLOW}Ejemplo:${NC}"
        echo "  $0 clone    # Primera vez, clonar todo"
        echo "  $0 backup   # Respaldos posteriores, solo datos"
        exit 1
        ;;
esac