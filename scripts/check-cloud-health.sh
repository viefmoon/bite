#!/bin/bash

# Script para verificar el estado del Cloud Service
# Uso: ./scripts/check-cloud-health.sh

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verificando estado del Cloud Service${NC}"
echo ""

# Verificar Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI no está instalado${NC}"
    exit 1
fi

# Obtener información del proyecto
echo -e "${YELLOW}📊 Información del proyecto:${NC}"
railway status

# Obtener URL del servicio
DOMAIN=$(railway status 2>/dev/null | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$DOMAIN" ]; then
    echo -e "\n${YELLOW}Obteniendo URL desde Railway...${NC}"
    # Intento alternativo para obtener la URL
    DOMAIN=$(railway open --json 2>/dev/null | jq -r '.url' 2>/dev/null)
fi

if [ -n "$DOMAIN" ]; then
    echo -e "\n${GREEN}URL del servicio: $DOMAIN${NC}"
    
    # Health check principal
    echo -e "\n${YELLOW}🏥 Health Check:${NC}"
    HEALTH=$(curl -s "$DOMAIN/api/sync/health" 2>/dev/null)
    if [ $? -eq 0 ] && echo "$HEALTH" | grep -q "ok"; then
        echo -e "${GREEN}✓ Servicio funcionando${NC}"
        echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
    else
        echo -e "${RED}✗ El servicio no responde${NC}"
    fi
    
    # Verificar webhook status
    echo -e "\n${YELLOW}🔗 Webhook Status:${NC}"
    WEBHOOK=$(curl -s "$DOMAIN/api/webhook/status" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "$WEBHOOK" | jq . 2>/dev/null || echo "$WEBHOOK"
    else
        echo -e "${RED}✗ No se pudo verificar el webhook${NC}"
    fi
    
else
    echo -e "\n${RED}No se pudo obtener la URL del servicio${NC}"
    echo -e "${YELLOW}Verifica en el dashboard de Railway${NC}"
fi

# Métricas de Railway
echo -e "\n${YELLOW}📈 Métricas recientes:${NC}"
echo "CPU, Memoria y Network (últimas 24h):"
echo -e "${YELLOW}Ver en: https://railway.app/dashboard${NC}"

# Últimos logs
echo -e "\n${YELLOW}📜 Últimos 10 logs:${NC}"
railway logs -n 10 2>/dev/null || echo -e "${RED}No se pudieron obtener los logs${NC}"

# Verificar variables críticas
echo -e "\n${YELLOW}🔐 Variables de entorno configuradas:${NC}"
VARS=$(railway variables 2>/dev/null)
CRITICAL_VARS=("DATABASE_URL" "WHATSAPP_VERIFY_TOKEN" "LOCAL_BACKEND_URL" "SYNC_API_KEY")

for var in "${CRITICAL_VARS[@]}"; do
    if echo "$VARS" | grep -q "$var"; then
        echo -e "${GREEN}✓ $var${NC}"
    else
        echo -e "${RED}✗ $var${NC}"
    fi
done

# Sugerencias
echo -e "\n${BLUE}💡 Comandos útiles:${NC}"
echo "  railway logs --tail    # Ver logs en tiempo real"
echo "  railway open          # Abrir dashboard en navegador"
echo "  railway run bash      # Acceder al contenedor"
echo "  railway restart       # Reiniciar servicio"