# Módulo de Procesamiento de Audio para Órdenes

Este módulo permite procesar órdenes a través de comandos de voz, integrándose con un servidor en la nube de procesamiento de audio.

## Configuración

### Variables de Entorno

El módulo utiliza las siguientes variables de entorno para conectarse al servidor remoto:

```env
# Configuración del servidor en la nube
CLOUD_API_URL=http://tu-servidor-remoto:8000
CLOUD_API_KEY=tu-api-key
```

**Nota:** Los valores de tamaño máximo (10MB) y timeout (30 segundos) están definidos directamente en el código para simplificar la configuración.

### Endpoint

El módulo expone el siguiente endpoint:

```
POST /api/audio-orders/process
```

#### Request Body

```json
{
  "audioData": "data:audio/mp4;base64,AAAA...",
  "transcription": "Quiero una pizza familiar de pepperoni",
  "audioFormat": "audio/mp4",
  "duration": 5.2,
  "customerId": "uuid-del-cliente",
  "orderId": "uuid-de-orden-existente"
}
```

#### Response

```json
{
  "success": true,
  "message": "Orden procesada correctamente",
  "order": { /* datos de la orden */ },
  "extractedData": {
    "action": "create_order",
    "products": [
      {
        "name": "Pizza Familiar Pepperoni",
        "quantity": 1,
        "variant": "familiar"
      }
    ]
  }
}
```

## Arquitectura

1. **Frontend**: Captura el audio y la transcripción, luego envía al backend
2. **Backend**: 
   - Valida los datos recibidos
   - Envía al servidor en la nube de procesamiento
   - Procesa la respuesta y ejecuta acciones (crear orden, modificar, consultar)
3. **Servidor en la Nube**: Analiza el audio y extrae las intenciones y entidades

## Seguridad

- El endpoint requiere autenticación JWT
- El tamaño máximo de audio es 10MB
- La comunicación con el servidor en la nube usa API Key
- Timeout de 30 segundos para evitar bloqueos

## Desarrollo

Para agregar nuevas acciones de procesamiento:

1. Actualiza el método `processRemoteResponse` en `audio-order-processing.service.ts`
2. Implementa el método correspondiente para la nueva acción
3. Actualiza los DTOs si es necesario