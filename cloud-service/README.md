# Cloud Service - WhatsApp Integration

Servicio minimalista en la nube para recibir webhooks de WhatsApp y procesarlos con IA, reenviando todo al backend local para el procesamiento principal.

## 📋 Documentación Completa

Para la guía completa de configuración y despliegue, consulta:
**[CLOUD_SERVICE_SETUP.md](../CLOUD_SERVICE_SETUP.md)**

## 🏗️ Arquitectura

Este servicio actúa como un puente entre WhatsApp Business API y el backend local del restaurante:

```
WhatsApp → Cloud Service (Railway) → Backend Local
             ↓ (si falla)
         Procesamiento IA
```

### Características:
- **Recibe webhooks** de WhatsApp Business API
- **Procesa mensajes** con IA (OpenAI/Gemini/Anthropic) como fallback
- **Reenvía todo** al backend local para procesamiento principal
- **Sin estado propio**: Solo lee de BD clonada para verificaciones

## 📦 Módulos

- **webhook**: Recibe y valida webhooks de WhatsApp
- **ai**: Procesa mensajes con IA cuando el backend local no está disponible
- **sync**: Sincroniza y reenvía datos al backend local

## 🚀 Quick Start

### Desarrollo Local

1. **Configurar entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

2. **Instalar y ejecutar**:
   ```bash
   npm install
   npm run start:dev
   ```

### Despliegue en Railway

```bash
# Usar el script de deploy
../scripts/deploy-cloud-service.sh

# O manualmente
railway link
railway up
```

## 🔧 Configuración

Variables de entorno requeridas:

```bash
# Base de datos (Railway la asigna automáticamente)
DATABASE_URL=postgresql://...

# Backend local
LOCAL_BACKEND_URL=http://tu-ip:3000/api
SYNC_API_KEY=tu_clave_secreta

# WhatsApp
WHATSAPP_VERIFY_TOKEN=tu_token
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
META_APP_SECRET=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx

# IA (al menos una)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

## 🌐 Endpoints

- `GET /webhook` - Verificación del webhook de WhatsApp
- `POST /webhook` - Recepción de mensajes
- `GET /sync/health` - Estado del servicio
- `POST /sync/database` - Trigger manual de sincronización

## 📊 Base de Datos

Este servicio **NO define sus propias entidades**. Usa la base de datos clonada del backend local en modo lectura para:
- Verificar clientes existentes
- Consultar productos y precios
- Validar configuraciones

## 🔄 Flujo de Mensajes

1. WhatsApp envía mensaje → `POST /webhook`
2. Validación del webhook (firma)
3. Intento de reenvío al backend local
4. Si falla: procesamiento con IA
5. Respuesta al usuario vía WhatsApp API

## 🛠️ Scripts Útiles

```bash
# Verificar estado del servicio
../scripts/check-cloud-health.sh

# Sincronizar base de datos
../scripts/sync-database.sh clone

# Ver logs en Railway
railway logs --tail
```

## 📈 Monitoreo

- **Logs**: `railway logs --tail`
- **Métricas**: Dashboard de Railway
- **Health**: `https://tu-dominio.up.railway.app/api/sync/health`

## 🤝 Desarrollo

Para contribuir:

1. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
2. Haz cambios y prueba localmente
3. Commit: `git commit -m "feat: descripción"`
4. Push y crea PR

## 📝 Notas

- El servicio es stateless y puede escalar horizontalmente
- Usa timeouts cortos para el backend local (3s)
- La IA es solo fallback, no reemplaza la lógica de negocio
- Railway incluye SSL automáticamente