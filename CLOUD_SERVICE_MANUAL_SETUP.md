# Guía Manual Completa - Cloud Service con WhatsApp

Esta guía te enseña cada comando manual para entender exactamente qué hace cada paso.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL funcionando localmente con tu base de datos
- Terminal abierta
- Navegador web

## Paso 1: Preparar Railway

### 1.1 Crear cuenta en Railway

1. Abre tu navegador
2. Ve a https://railway.app
3. Click en "Start a New Project"
4. Regístrate con GitHub o email
5. Verifica tu cuenta

### 1.2 Instalar Railway CLI

```bash
# Instalar la herramienta de línea de comandos de Railway
npm install -g @railway/cli

# Verificar que se instaló
railway --version

# Iniciar sesión (abrirá el navegador)
railway login
```

### 1.3 Crear proyecto nuevo en Railway

**Desde el navegador:**
1. Ve a https://railway.app/dashboard
2. Click en "New Project"
3. Selecciona "Empty Project"
4. Dale el nombre "bite-cloud-service"

## Paso 2: Crear Base de Datos en Railway

### 2.1 Agregar PostgreSQL

1. En tu proyecto de Railway (navegador)
2. Click en "+ New"
3. Selecciona "Database"
4. Click en "PostgreSQL"
5. Espera 2 minutos a que se cree

### 2.2 Obtener credenciales de la base de datos

1. Click en el icono de PostgreSQL
2. Ve a la pestaña "Variables"
3. Busca `DATABASE_URL`
4. Click en el icono de copiar
5. Guarda esta URL, la necesitarás

Ejemplo de cómo se ve:
```
postgresql://postgres:ABCdef123456@roundhouse.proxy.rlwy.net:12345/railway
```

## Paso 3: Configurar tu Proyecto Local

### 3.1 Agregar la URL de Railway a tu configuración

```bash
# Abrir el archivo de configuración de tu backend local
nano backend/.env

# Buscar la línea RAILWAY_DATABASE_URL (debería estar vacía)
# Agregar la URL que copiaste de Railway:
RAILWAY_DATABASE_URL=postgresql://postgres:ABCdef123456@roundhouse.proxy.rlwy.net:12345/railway

# Guardar: Ctrl+X, luego Y, luego Enter
```

**Nota:** Esta variable ya está documentada en `backend/env-example-relational`. Se usa solo para clonar/respaldar tu base de datos desde tu computadora local hacia Railway.

### 3.2 Verificar conexión a ambas bases de datos

```bash
# Primero, cargar las variables de entorno de tu backend
cd backend
source .env
cd ..

# Ahora sí, verificar conexión a tu base de datos local
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Verificar conexión a Railway
psql $RAILWAY_DATABASE_URL -c "SELECT version();"
```

## Paso 4: Clonar tu Base de Datos Local a Railway

### 4.1 Exportar tu base de datos local

```bash
# Crear un respaldo completo de tu base de datos local
# Esto incluye estructura, datos, índices, todo
pg_dump $DATABASE_URL --clean --no-owner --no-acl > backup_local.sql

# Verificar que se creó el archivo
ls -lh backup_local.sql
```

### 4.2 Importar a Railway

```bash
# Importar todo a la base de datos de Railway
psql $RAILWAY_DATABASE_URL < backup_local.sql

# Esto puede tomar unos minutos dependiendo del tamaño
```

### 4.3 Verificar que se clonó correctamente

```bash
# Ver las tablas en Railway
psql $RAILWAY_DATABASE_URL -c "\dt"

# Contar registros de una tabla importante
psql $RAILWAY_DATABASE_URL -c "SELECT COUNT(*) FROM products;"
```

## Paso 5: Preparar el Cloud Service para Deploy

### 5.1 Verificar que el código compila

```bash
# Ir al directorio del cloud service
cd cloud-service

# Instalar dependencias
npm install

# Probar que compila
npm run build

# Si todo está bien, verás:
# Successfully compiled X files with swc.

# Volver al directorio principal
cd ..
```

### 5.2 Vincular con Railway

```bash
# Desde la raíz del proyecto
cd /home/leo/Escritorio/bite

# Vincular con Railway
railway link

# Te preguntará:
# 1. Selecciona tu proyecto "bite-cloud-service"
# 2. Selecciona el environment (probablemente "production")
```

### 5.3 Verificar vinculación

```bash
# Ver estado
railway status

# Deberías ver:
# Project: bite-cloud-service
# Environment: production
```

## Paso 6: Configurar Variables de Entorno en Railway

### 6.1 Ir a las variables del servicio

1. En el dashboard de Railway
2. Click en "+ New" → "Empty Service"
3. Nómbralo "cloud-service"
4. Click en el servicio
5. Ve a la pestaña "Variables"

### 6.2 Agregar cada variable (una por una)

Click en "New Variable" para cada una:

```bash
# Base de datos - IMPORTANTE: Usa la referencia
DATABASE_URL = ${POSTGRES_DATABASE_URL}

# Token de verificación para WhatsApp (inventa uno seguro)
WHATSAPP_VERIFY_TOKEN = mi_token_super_seguro_123

# Credenciales de WhatsApp (de Meta for Developers)
WHATSAPP_ACCESS_TOKEN = EAAxxxxx...
META_APP_SECRET = abc123...
WHATSAPP_PHONE_NUMBER_ID = 123456789...

# Conexión con tu backend local
LOCAL_BACKEND_URL = https://tu-backend.ngrok.io/api
SYNC_API_KEY = clave_secura_sync_123

# JWT Secret (el mismo que uses en tu backend)
JWT_SECRET = tu_jwt_secret_aqui

# Puerto
PORT = 5000

# Ambiente
NODE_ENV = production

# API de IA (al menos una)
OPENAI_API_KEY = sk-...
```

## Paso 7: Desplegar Manualmente

### 7.1 Hacer commit de los cambios

```bash
# Ver qué archivos cambiaron
git status

# Agregar todos los cambios
git add .

# Crear commit
git commit -m "Setup cloud service for deployment"
```

### 7.2 Desplegar a Railway

```bash
# Desplegar
railway up

# Verás algo como:
# Indexing...
# Uploading...
# Build Logs: https://railway.app/project/...
```

### 7.3 Ver los logs de construcción

```bash
# Ver logs mientras se construye
railway logs

# O puedes abrir la URL que te dio en el navegador
```

## Paso 8: Obtener URL del Servicio

### 8.1 Generar dominio público

1. En Railway dashboard
2. Click en tu servicio "cloud-service"
3. Ve a "Settings"
4. En "Domains", click "Generate Domain"
5. Obtendrás algo como: `https://bite-cloud-service-production.up.railway.app`

### 8.2 Probar que funciona

```bash
# Reemplaza con tu URL real
curl https://bite-cloud-service-production.up.railway.app/api/sync/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2025-06-13T..."}
```

## Paso 9: Configurar WhatsApp

### 9.1 Configurar webhook en Meta

1. Ve a https://developers.facebook.com
2. Tu App → WhatsApp → Configuration
3. En "Webhook":
   - **Callback URL**: `https://tu-servicio.railway.app/api/webhook`
   - **Verify Token**: el mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
4. Click "Verify and Save"
5. Suscríbete a: `messages` y `messaging_postbacks`

## Paso 10: Conectar Backend Local

### 10.1 Opción A: Usar ngrok (temporal)

```bash
# En otra terminal
ngrok http 3000

# Copia la URL HTTPS que te da
# Ejemplo: https://abc123.ngrok-free.app

# Actualiza LOCAL_BACKEND_URL en Railway con esta URL
```

### 10.2 Opción B: IP pública (permanente)

1. Obtén tu IP pública: `curl ifconfig.me`
2. Configura port forwarding en tu router (puerto 3000)
3. Usa `http://tu-ip-publica:3000/api` en LOCAL_BACKEND_URL

## 📊 Comandos de Monitoreo

### Ver logs en tiempo real

```bash
# Logs del servicio
railway logs

# Seguir logs nuevos
railway logs -f
```

### Ver estado del servicio

```bash
# Estado general
railway status

# Abrir dashboard en navegador
railway open
```

## 🔧 Mantenimiento Manual

### Actualizar el servicio

```bash
# Después de hacer cambios en el código
git add .
git commit -m "Update cloud service"
railway up
```

### Respaldar base de datos

```bash
# Exportar de Railway
pg_dump $RAILWAY_DATABASE_URL > backup_railway_$(date +%Y%m%d).sql

# Importar a local (restaurar)
psql $DATABASE_URL < backup_railway_20250613.sql
```

### Sincronizar cambios de BD

```bash
# Solo estructura
pg_dump $DATABASE_URL --schema-only | psql $RAILWAY_DATABASE_URL

# Solo datos
pg_dump $DATABASE_URL --data-only | psql $RAILWAY_DATABASE_URL

# Todo
pg_dump $DATABASE_URL --clean | psql $RAILWAY_DATABASE_URL
```

## ❓ Verificación de Problemas

### Verificar que el servicio está corriendo

```bash
# Debería responder con OK
curl https://tu-servicio.railway.app/api/sync/health
```

### Verificar conexión a base de datos

```bash
# Ejecutar en Railway
railway run psql $DATABASE_URL -c "SELECT 1;"
```

### Verificar variables de entorno

```bash
# Ver todas las variables
railway variables
```

### Verificar logs de error

```bash
# Últimas 50 líneas
railway logs -n 50
```

## 📝 Resumen de URLs y Endpoints

- **Tu servicio**: `https://bite-cloud-service-production.up.railway.app`
- **Health check**: `/api/sync/health`
- **Webhook WhatsApp**: `/api/webhook`
- **Dashboard Railway**: https://railway.app/dashboard

## 🔄 Flujo Completo

1. WhatsApp recibe mensaje del cliente
2. WhatsApp envía POST a tu webhook
3. Cloud Service recibe el mensaje
4. Cloud Service reenvía a tu backend local
5. Backend local procesa y responde
6. Cloud Service envía respuesta a WhatsApp
7. Cliente recibe respuesta

¡Listo! Ahora entiendes cada paso del proceso 🎉