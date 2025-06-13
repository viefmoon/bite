# Guía Completa de Configuración del Cloud Service

Esta guía unifica todo lo necesario para configurar el servicio en la nube que integra WhatsApp con el backend local del restaurante.

## Índice

1. [Arquitectura y Flujo](#arquitectura-y-flujo)
2. [Configuración Inicial de Railway](#configuración-inicial-de-railway)
3. [Base de Datos en Railway](#base-de-datos-en-railway)
4. [Despliegue del Cloud Service](#despliegue-del-cloud-service)
5. [Integración con WhatsApp](#integración-con-whatsapp)
6. [Conexión con Backend Local](#conexión-con-backend-local)
7. [Sincronización de Base de Datos](#sincronización-de-base-de-datos)
8. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
9. [Troubleshooting](#troubleshooting)

## Arquitectura y Flujo

El Cloud Service actúa como un puente entre WhatsApp Business API y tu backend local:

```
WhatsApp → Cloud Service (Railway) → Backend Local
             ↓ (si falla)
         Procesamiento IA
```

### Características principales:
- **Minimalista**: Solo recibe webhooks y reenvía al backend local
- **Resiliente**: Usa IA como fallback si el backend local no responde
- **Sin estado**: No almacena datos propios, solo lee de la BD clonada
- **Escalable**: Desplegado en Railway con auto-scaling

## Configuración Inicial de Railway

### 1. Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub (recomendado) o email
3. Verifica tu cuenta

### 2. Instalar Railway CLI
```bash
# Instalar globalmente
npm install -g @railway/cli

# Verificar instalación
railway --version

# Iniciar sesión
railway login
```

### 3. Crear nuevo proyecto
```bash
# Desde la raíz del proyecto
cd /home/leo/Escritorio/bite

# Crear proyecto en Railway
railway init

# O desde el dashboard web:
# 1. New Project → Empty Project
# 2. Nombrar como "bite-cloud-service"
```

## Base de Datos en Railway

### Opción 1: Base de datos dedicada para Cloud Service (RECOMENDADO)

1. **Crear PostgreSQL en Railway**:
   ```bash
   # En el dashboard de Railway
   # New → Database → Add PostgreSQL
   # Nombrar: "cloud-service-db"
   ```

2. **Clonar estructura del backend local**:
   ```bash
   # Exportar solo estructura desde local
   cd backend
   pg_dump $DATABASE_URL --schema-only > /tmp/schema.sql
   
   # Importar en Railway
   psql $RAILWAY_DATABASE_URL < /tmp/schema.sql
   ```

### Opción 2: Base de datos de respaldo completa

1. **Crear segunda PostgreSQL**:
   - Nombrar: "backend-mirror-db"
   - Usar para respaldo completo del backend local

2. **Script de sincronización**:
   ```bash
   #!/bin/bash
   # scripts/sync-database.sh
   
   # Cargar variables
   source backend/.env
   RAILWAY_DB_URL="postgresql://..." # De Railway
   
   # Sincronizar datos
   pg_dump $DATABASE_URL --data-only | psql $RAILWAY_DB_URL
   ```

## Despliegue del Cloud Service

### 1. Configurar el servicio en Railway

1. **Crear servicio**:
   - New → Empty Service
   - Nombrar: "cloud-service"

2. **Configurar build**:
   ```json
   {
     "rootDirectory": "/cloud-service",
     "buildCommand": "npm run build",
     "startCommand": "./start.sh"
   }
   ```

### 2. Variables de entorno

En Variables del servicio cloud-service:

```bash
# Base de datos (referencia al PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=tu_token_verificacion_seguro
WHATSAPP_ACCESS_TOKEN=EAAxxxxx...
META_APP_SECRET=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx

# APIs de IA (al menos una)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# Backend local
LOCAL_BACKEND_URL=http://tu-ip-publica:3000/api
SYNC_API_KEY=clave_secreta_para_sync

# JWT (mismo que el backend local)
JWT_SECRET=mismo_secret_que_backend_local

# Configuración
PORT=5000
NODE_ENV=production
SYNC_ENABLED=true
```

### 3. Preparar el código

```bash
# Verificar estructura
bite/
├── cloud-service/
│   ├── package.json
│   ├── src/
│   ├── start.sh        # Script de inicio
│   └── Dockerfile      # Para Railway
├── backend/
├── app/
└── shared/             # Tipos compartidos
```

### 4. Desplegar

```bash
# Vincular proyecto local con Railway
cd /home/leo/Escritorio/bite
railway link

# Seleccionar:
# - Proyecto: bite-cloud-service
# - Environment: production
# - Service: cloud-service

# Desplegar
railway up

# Ver logs
railway logs --tail
```

### 5. Configurar dominio

1. En Railway dashboard → cloud-service → Settings → Domains
2. Generate Domain
3. Obtendrás: `cloud-service-production-xxx.up.railway.app`

## Integración con WhatsApp

### 1. Configurar webhook en Meta

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Tu App → WhatsApp → Configuration → Webhooks
3. Configurar:
   - Callback URL: `https://tu-dominio.up.railway.app/api/webhook`
   - Verify Token: El mismo de `WHATSAPP_VERIFY_TOKEN`
   - Campos: `messages`, `messaging_postbacks`

### 2. Verificar webhook

```bash
# Ver logs de verificación
railway logs --tail

# Test manual
curl https://tu-dominio.up.railway.app/api/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test
```

### 3. Configurar número de teléfono

En Meta for Developers:
1. WhatsApp → API Setup
2. Añadir número de teléfono
3. Verificar número
4. Copiar Phone Number ID a las variables

## Conexión con Backend Local

### 1. Exponer backend local

#### Opción A: IP pública (producción)
```bash
# En backend/.env
HOST=0.0.0.0
PORT=3000

# Configurar firewall para permitir puerto 3000
sudo ufw allow 3000/tcp
```

#### Opción B: Túnel temporal (desarrollo)
```bash
# Usando ngrok
ngrok http 3000

# Usar la URL generada en LOCAL_BACKEND_URL
```

### 2. Configurar autenticación

En el backend local, crear endpoint para el cloud service:

```typescript
// backend/src/modules/cloud-sync/cloud-sync.controller.ts
@Controller('cloud-sync')
export class CloudSyncController {
  @Post('webhook')
  @UseGuards(ApiKeyGuard)
  async receiveWebhook(@Body() data: any) {
    // Procesar webhook reenviado desde cloud
  }
}
```

### 3. Probar conexión

```bash
# Desde el cloud service
curl http://tu-backend-local:3000/api/health

# Ver logs en Railway
railway logs --tail
```

## Sincronización de Base de Datos

### 1. Sincronización manual

```bash
#!/bin/bash
# scripts/quick-backup.sh

# Variables
LOCAL_DB="postgresql://postgres:password@localhost:5432/bite"
RAILWAY_DB=$(railway variables | grep DATABASE_URL | cut -d'=' -f2)

# Backup local → Railway
echo "Respaldando a Railway..."
pg_dump $LOCAL_DB --clean --if-exists | psql $RAILWAY_DB

echo "Backup completado!"
```

### 2. Sincronización automática

Agregar al backend local:

```typescript
// backend/src/modules/backup/backup.service.ts
@Injectable()
export class BackupService {
  // Respaldar cada 6 horas
  @Cron('0 */6 * * *')
  async autoBackup() {
    if (process.env.AUTO_BACKUP === 'true') {
      await this.backupToRailway();
    }
  }
}
```

### 3. Comandos útiles

```bash
# Ver estado de la BD en Railway
railway run psql -c "SELECT COUNT(*) FROM orders;"

# Backup solo tablas críticas
pg_dump -t customers -t orders $LOCAL_DB | psql $RAILWAY_DB

# Verificar sincronización
railway run psql -c "\dt"
```

## Monitoreo y Mantenimiento

### 1. Monitoreo en Railway

- Dashboard → Metrics:
  - CPU y Memoria
  - Request count
  - Response times
  - Error rates

### 2. Alertas

Configurar en Railway:
1. Settings → Notifications
2. Configurar alertas para:
   - Deploy failures
   - High CPU/Memory
   - Crashes

### 3. Logs

```bash
# Logs en tiempo real
railway logs --tail

# Últimas 100 líneas
railway logs -n 100

# Buscar errores
railway logs | grep ERROR
```

### 4. Health checks

```bash
# Verificar servicio
curl https://tu-dominio.up.railway.app/api/sync/health

# Verificar webhook
curl https://tu-dominio.up.railway.app/api/webhook/status
```

## Troubleshooting

### Problema: Webhook no se verifica

```bash
# Verificar token
railway variables | grep WHATSAPP_VERIFY_TOKEN

# Ver logs de verificación
railway logs --tail | grep "Webhook verified"
```

### Problema: No se conecta al backend local

1. Verificar IP pública/URL
2. Verificar firewall
3. Probar con curl desde Railway:
   ```bash
   railway run curl http://tu-backend:3000/api/health
   ```

### Problema: Base de datos vacía

```bash
# Verificar conexión
railway run psql -c "\l"

# Reimportar schema
railway run psql < backend/schema.sql
```

### Problema: Mensajes no se procesan

1. Verificar logs: `railway logs --tail`
2. Verificar API keys de IA
3. Verificar formato del webhook

### Problema: Deploy falla

```bash
# Ver logs de build
railway logs --build

# Limpiar cache y redesplegar
railway up --no-cache
```

## Scripts de utilidad

### deploy.sh
```bash
#!/bin/bash
# scripts/deploy-cloud-service.sh

echo "🚀 Desplegando Cloud Service..."

# Actualizar código
git add .
git commit -m "Update cloud service"
git push

# Desplegar a Railway
cd /home/leo/Escritorio/bite
railway up

echo "✅ Deploy completado!"
echo "📊 Ver logs: railway logs --tail"
```

### check-health.sh
```bash
#!/bin/bash
# scripts/check-cloud-health.sh

DOMAIN="cloud-service-production-xxx.up.railway.app"

echo "🔍 Verificando Cloud Service..."

# Health check
curl -s https://$DOMAIN/api/sync/health | jq .

# Webhook status
curl -s https://$DOMAIN/api/webhook/status | jq .

# Últimos logs
railway logs -n 20
```

## Mejores prácticas

1. **Seguridad**:
   - Usar HTTPS siempre
   - Rotar API keys regularmente
   - No commitear credenciales

2. **Performance**:
   - Cachear respuestas comunes
   - Timeout cortos para backend local
   - Usar IA solo como fallback

3. **Mantenimiento**:
   - Backup diario de BD
   - Monitorear uso de Railway
   - Revisar logs semanalmente

4. **Costos**:
   - Railway: $5 USD gratis/mes
   - Monitorear uso de recursos
   - Optimizar queries a BD

## Siguiente paso

Una vez configurado:

1. Envía mensaje de prueba a WhatsApp
2. Verifica logs: `railway logs --tail`
3. Confirma que llegue al backend local
4. Configura respuestas automáticas

## Soporte

- Railway: [docs.railway.app](https://docs.railway.app)
- WhatsApp Business: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- Issues: Crear en el repositorio del proyecto