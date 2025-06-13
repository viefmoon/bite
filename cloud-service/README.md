# Cloud Service - WhatsApp Integration

Servicio minimalista en la nube para recibir webhooks de WhatsApp y procesarlos con IA, reenviando todo al backend local para el procesamiento principal.

## Arquitectura

Este servicio actúa como un puente entre WhatsApp Business API y el backend local del restaurante:

1. **Recibe webhooks** de WhatsApp
2. **Procesa mensajes** con IA (OpenAI) como fallback
3. **Reenvía todo** al backend local para procesamiento y almacenamiento

## Módulos

- **webhook**: Recibe y valida webhooks de WhatsApp
- **ai**: Procesa mensajes con IA cuando el backend local no está disponible
- **sync**: Sincroniza y reenvía datos al backend local

## Configuración

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar:
   - `DATABASE_URL`: Conexión a la BD clonada del backend local
   - `BACKEND_LOCAL_URL`: URL del backend local
   - `WHATSAPP_*`: Credenciales de WhatsApp Business API
   - `OPENAI_API_KEY`: API key de OpenAI

3. Instalar dependencias:
```bash
npm install
```

4. Ejecutar:
```bash
npm run start:dev # Desarrollo
npm run start:prod # Producción
```

## Base de Datos

Este servicio **NO define sus propias entidades**. Usa la base de datos clonada del backend local en modo lectura para verificaciones básicas.

## Flujo de Mensajes

1. WhatsApp envía webhook → `/webhook`
2. El servicio intenta reenviar al backend local
3. Si el backend local no responde, procesa con IA
4. Responde al usuario vía WhatsApp API

## Endpoints

- `GET /webhook` - Verificación del webhook de WhatsApp
- `POST /webhook` - Recepción de mensajes
- `GET /sync/health` - Estado del servicio
- `POST /sync/database` - Trigger manual de sincronización (requiere API key)