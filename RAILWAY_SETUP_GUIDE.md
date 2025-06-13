# Guía Completa de Configuración de Railway para Cloud Service

## 1. Preparación Inicial

### 1.1 Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub (recomendado) o con email
3. Verifica tu email si es necesario

### 1.2 Instalar Railway CLI
```bash
# Instalar Railway CLI globalmente
npm install -g @railway/cli

# Verificar instalación
railway --version
```

### 1.3 Login en Railway CLI
```bash
# Iniciar sesión
railway login

# Esto abrirá tu navegador para autenticarte
```

## 2. Crear Nuevo Proyecto en Railway

### 2.1 Desde el Dashboard Web
1. Ve a [railway.app/dashboard](https://railway.app/dashboard)
2. Click en "New Project"
3. Selecciona "Empty Project"
4. Dale un nombre descriptivo como "bite-cloud-service"

### 2.2 Desde el CLI (Alternativa)
```bash
# Desde la raíz del proyecto
cd /home/leo/Escritorio/bite

# Crear nuevo proyecto
railway init
```

## 3. Configurar Base de Datos PostgreSQL

### 3.1 Agregar PostgreSQL al proyecto
1. En el dashboard de Railway, dentro de tu proyecto
2. Click en "New" → "Database" → "Add PostgreSQL"
3. Espera a que se provisione (1-2 minutos)
4. Click en la base de datos → Variables → Copia DATABASE_URL

### 3.2 Guardar DATABASE_URL
```bash
# Crear archivo .env.railway para referencia local
echo "DATABASE_URL=postgresql://..." > cloud-service/.env.railway
```

## 4. Configurar el Servicio Cloud

### 4.1 Crear el servicio en Railway
1. En el dashboard, click en "New" → "Empty Service"
2. Nómbralo "cloud-service"
3. En Settings del servicio:
   - Root Directory: `/cloud-service`
   - Build Command: `npm run build`
   - Start Command: `./start.sh`

### 4.2 Configurar Variables de Entorno
En el servicio cloud-service, ve a "Variables" y agrega:

```bash
# Base de datos (copia el DATABASE_URL del servicio PostgreSQL)
DATABASE_URL=postgresql://...

# WhatsApp
WHATSAPP_VERIFY_TOKEN=tu_token_verificacion_seguro
WHATSAPP_ACCESS_TOKEN=tu_token_acceso_whatsapp
META_APP_SECRET=tu_app_secret_de_meta

# APIs de IA (opcional, agrega las que uses)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Puerto (Railway lo asigna automáticamente, pero podemos especificarlo)
PORT=5000

# JWT Secret para tokens
JWT_SECRET=un_string_aleatorio_muy_seguro

# Configuración de sincronización
SYNC_ENABLED=true
LOCAL_BACKEND_URL=http://tu-ip-local:3000/api
SYNC_API_KEY=una_clave_segura_para_sync
```

### 4.3 Configurar Variables de Referencia
Railway permite referenciar variables entre servicios:

1. En Variables del cloud-service
2. Para DATABASE_URL, usa la referencia:
   - Click en DATABASE_URL
   - Selecciona "Reference"
   - Elige el servicio PostgreSQL
   - Selecciona DATABASE_URL

## 5. Preparar el Código para Deploy

### 5.1 Verificar estructura del proyecto
```bash
bite/
├── package.json          # Monorepo root
├── cloud-service/       # Servicio cloud
│   ├── package.json
│   ├── src/
│   ├── Dockerfile
│   └── start.sh
├── backend/            # Backend local existente
├── app/               # App móvil
└── shared/           # Tipos compartidos
```

### 5.2 Crear railway.json (opcional)
```bash
# En la raíz del proyecto
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

## 6. Vincular y Desplegar

### 6.1 Vincular proyecto local con Railway
```bash
# Desde la raíz del proyecto
cd /home/leo/Escritorio/bite

# Vincular con Railway
railway link

# Selecciona:
# 1. Tu proyecto (bite-cloud-service o el nombre que le diste)
# 2. El environment (production)
# 3. El servicio (cloud-service)
```

### 6.2 Verificar vinculación
```bash
railway status
```

### 6.3 Desplegar
```bash
# Deploy completo con logs
railway up

# O deploy sin adjuntar logs
railway up --detach
```

## 7. Verificar Despliegue

### 7.1 Ver logs
```bash
railway logs
```

### 7.2 Obtener URL del servicio
1. En el dashboard de Railway
2. Click en el servicio cloud-service
3. En Settings → Domains
4. Click en "Generate Domain"
5. Obtendrás algo como: `cloud-service-production-xyz.up.railway.app`

### 7.3 Probar el servicio
```bash
# Verificar que esté funcionando
curl https://tu-dominio.up.railway.app/api/health

# Debería responder con:
# {"status":"ok","timestamp":"..."}
```

## 8. Configurar Webhook de WhatsApp

### 8.1 Configurar en Meta for Developers
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Tu App → WhatsApp → Configuration → Webhook
3. Callback URL: `https://tu-dominio.up.railway.app/api/webhook`
4. Verify Token: El mismo que pusiste en WHATSAPP_VERIFY_TOKEN
5. Suscríbete a los campos: messages, messaging_postbacks

### 8.2 Verificar webhook
```bash
# Railway logs para ver la verificación
railway logs --tail
```

## 9. Troubleshooting Común

### Problema: "Multiple services found"
```bash
# Especifica el servicio
railway up --service cloud-service
```

### Problema: Build fails
```bash
# Ver logs de build
railway logs --build

# Reconstruir desde cero
railway up --no-cache
```

### Problema: Variables de entorno no se cargan
1. Verifica en el dashboard que estén configuradas
2. Redespliega: `railway up`

### Problema: Puerto no accesible
Railway asigna el puerto automáticamente. Asegúrate de usar:
```javascript
const port = process.env.PORT || 5000;
```

## 10. Comandos Útiles de Railway

```bash
# Ver todos los logs
railway logs

# Ver logs en tiempo real
railway logs --tail

# Ver variables de entorno
railway variables

# Ejecutar comando en el contenedor
railway run echo "test"

# Ver estado del proyecto
railway status

# Abrir dashboard en navegador
railway open
```

## 11. Actualizar el Servicio

Cuando hagas cambios:
```bash
# Commit tus cambios
git add .
git commit -m "Update cloud service"

# Redesplegar
railway up
```

## 12. Monitoreo y Métricas

1. En el dashboard de Railway
2. Click en tu servicio
3. Ve a "Metrics" para ver:
   - Uso de CPU
   - Memoria
   - Network
   - Logs

## Notas Importantes

- **Costos**: Railway ofrece $5 USD gratis al mes, suficiente para proyectos pequeños
- **Dominios**: Los dominios generados son permanentes mientras el servicio exista
- **SSL**: Todos los dominios incluyen SSL automáticamente
- **Backups**: Configura backups de PostgreSQL en Settings → Backups
- **Escalado**: Puedes escalar agregando más replicas en Settings → Scaling

## Siguiente Paso

Una vez desplegado exitosamente:
1. Configura el webhook en WhatsApp
2. Prueba enviando un mensaje
3. Monitorea los logs: `railway logs --tail`
4. Configura la sincronización con tu backend local