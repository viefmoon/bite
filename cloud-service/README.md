# Cloud Service - WhatsApp Order Management

Servicio en la nube para recibir y procesar pedidos a través de WhatsApp Business API.

## Características

- 🔔 **Webhooks de WhatsApp**: Recibe y procesa mensajes de texto, audio e interactivos
- 🤖 **IA Integrada**: Procesamiento inteligente con OpenAI, Gemini o Claude
- 📱 **Sistema OTP**: Verificación de teléfonos y registro de direcciones
- 🔄 **Sincronización**: Se sincroniza con el backend local del restaurante
- 📦 **Gestión de Pedidos**: Crea y gestiona pedidos desde WhatsApp
- 👥 **Gestión de Clientes**: Registro automático con múltiples direcciones

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar migraciones
npm run migration:run
```

## Estructura del Proyecto

```
cloud-service/
├── src/
│   ├── entities/          # Entidades de TypeORM
│   ├── modules/           # Módulos de NestJS
│   │   ├── webhook/       # Procesamiento de webhooks
│   │   ├── orders/        # Gestión de pedidos
│   │   ├── customers/     # Gestión de clientes
│   │   ├── otp/          # Sistema OTP
│   │   ├── ai/           # Integración con IA
│   │   └── sync/         # Sincronización
│   └── main.ts           # Punto de entrada
├── package.json
└── start.sh              # Script de inicio para producción
```

## API Endpoints

### Webhook
- `GET /api/webhook` - Verificación de webhook
- `POST /api/webhook` - Recepción de mensajes

### Sincronización
- `GET /api/sync/health` - Estado del servicio
- `POST /api/sync/products` - Recibir productos del backend local
- `POST /api/sync/order-status` - Actualizar estado de pedido

### Clientes
- `POST /api/customers/:phone/verify-otp` - Verificar OTP
- `GET /api/customers/:phone/addresses` - Obtener direcciones

### Pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders/:id` - Obtener pedido

## Despliegue en Railway

Ver [RAILWAY_SETUP_GUIDE.md](../RAILWAY_SETUP_GUIDE.md) para instrucciones detalladas.

## Flujo de Pedido

1. Cliente envía mensaje a WhatsApp
2. Webhook recibe y procesa el mensaje
3. IA interpreta la intención del cliente
4. Si es nuevo cliente, se envía OTP
5. Cliente verifica OTP y registra dirección
6. Se crea el pedido
7. Se sincroniza con backend local
8. Cliente recibe confirmación

## Configuración de WhatsApp

1. Crear app en Meta for Developers
2. Configurar webhook con URL: `https://tu-dominio.railway.app/api/webhook`
3. Token de verificación: El mismo en `WHATSAPP_VERIFY_TOKEN`
4. Suscribirse a: messages, messaging_postbacks

## Troubleshooting

### El webhook no se verifica
- Verifica que `WHATSAPP_VERIFY_TOKEN` sea el mismo en Meta y Railway
- Revisa los logs: `railway logs`

### No llegan mensajes
- Verifica suscripciones del webhook
- Confirma que el número está agregado en Meta

### Error de base de datos
- Verifica `DATABASE_URL` en Railway
- Ejecuta migraciones: `npm run migration:run`