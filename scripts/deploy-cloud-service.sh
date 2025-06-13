#!/bin/bash

# Script para desplegar cloud-service a Railway
# Uso: ./scripts/deploy-cloud-service.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Desplegando Cloud Service a Railway${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "cloud-service" ]; then
    echo -e "${RED}Error: No se encontró el directorio cloud-service${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar instalación de Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala con: npm install -g @railway/cli${NC}"
    exit 1
fi

# Función para verificar el estado del proyecto
check_railway_status() {
    echo -e "${YELLOW}📋 Verificando estado del proyecto...${NC}"
    
    if railway status &> /dev/null; then
        echo -e "${GREEN}✓ Proyecto vinculado con Railway${NC}"
        railway status
    else
        echo -e "${RED}✗ Proyecto no vinculado${NC}"
        echo -e "${YELLOW}Ejecuta 'railway link' primero${NC}"
        exit 1
    fi
}

# Función para verificar variables de entorno
check_env_vars() {
    echo -e "\n${YELLOW}🔐 Verificando variables de entorno...${NC}"
    
    REQUIRED_VARS=(
        "DATABASE_URL"
        "WHATSAPP_VERIFY_TOKEN"
        "WHATSAPP_ACCESS_TOKEN"
        "LOCAL_BACKEND_URL"
        "SYNC_API_KEY"
    )
    
    MISSING_VARS=()
    
    # Obtener variables de Railway
    RAILWAY_VARS=$(railway variables 2>/dev/null)
    
    for var in "${REQUIRED_VARS[@]}"; do
        if echo "$RAILWAY_VARS" | grep -q "$var"; then
            echo -e "${GREEN}✓ $var${NC}"
        else
            echo -e "${RED}✗ $var falta${NC}"
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "\n${RED}Error: Faltan variables de entorno${NC}"
        echo -e "${YELLOW}Configura las variables en el dashboard de Railway${NC}"
        exit 1
    fi
}

# Función para hacer build local de prueba
test_build() {
    echo -e "\n${YELLOW}🔨 Probando build local...${NC}"
    
    cd cloud-service
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        echo "Instalando dependencias..."
        npm install
    fi
    
    # Probar build
    if npm run build; then
        echo -e "${GREEN}✓ Build local exitoso${NC}"
    else
        echo -e "${RED}✗ Error en el build${NC}"
        exit 1
    fi
    
    cd ..
}

# Función para desplegar
deploy() {
    echo -e "\n${YELLOW}🚂 Desplegando a Railway...${NC}"
    
    # Guardar cambios si hay
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}Hay cambios sin guardar. Commitiendo...${NC}"
        git add .
        git commit -m "Deploy cloud-service to Railway"
    fi
    
    # Desplegar
    if railway up --service cloud-service; then
        echo -e "${GREEN}✓ Despliegue exitoso${NC}"
    else
        echo -e "${RED}✗ Error en el despliegue${NC}"
        exit 1
    fi
}

# Función para verificar el servicio
verify_deployment() {
    echo -e "\n${YELLOW}🔍 Verificando despliegue...${NC}"
    
    # Obtener URL del servicio
    DOMAIN=$(railway status | grep -oP 'https://[^\s]+' | head -1)
    
    if [ -n "$DOMAIN" ]; then
        echo -e "URL del servicio: ${BLUE}$DOMAIN${NC}"
        
        # Verificar health check
        echo -e "\n${YELLOW}Verificando health check...${NC}"
        HEALTH_RESPONSE=$(curl -s "$DOMAIN/api/sync/health")
        
        if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
            echo -e "${GREEN}✓ Servicio funcionando correctamente${NC}"
            echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
        else
            echo -e "${RED}✗ El servicio no responde correctamente${NC}"
        fi
    else
        echo -e "${YELLOW}No se pudo obtener la URL del servicio${NC}"
        echo "Verifica en el dashboard de Railway"
    fi
}

# Función para mostrar logs
show_logs() {
    echo -e "\n${YELLOW}📜 Últimos logs:${NC}"
    railway logs --tail -n 20
}

# Menú de opciones
echo -e "${BLUE}Selecciona una opción:${NC}"
echo "1) Despliegue completo"
echo "2) Solo verificar estado"
echo "3) Ver logs"
echo "4) Desplegar sin verificaciones"

read -p "Opción (1-4): " option

case $option in
    1)
        check_railway_status
        check_env_vars
        test_build
        deploy
        verify_deployment
        echo -e "\n${GREEN}✅ Despliegue completado${NC}"
        echo -e "${YELLOW}Ejecuta 'railway logs --tail' para ver logs en tiempo real${NC}"
        ;;
    2)
        check_railway_status
        check_env_vars
        verify_deployment
        ;;
    3)
        show_logs
        ;;
    4)
        deploy
        ;;
    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac