# Guía de Implementación de Endpoints de Sincronización

## Endpoints Requeridos en el Backend Remoto (Puerto 5000)

Tu backend de WhatsApp necesita implementar estos endpoints para recibir la sincronización del backend del restaurante:

### 1. Sincronizar Menú
**POST** `/api/sync/menu`

**Headers:**
```
X-API-Key: 1234
Content-Type: application/json
```

**Body:**
```json
{
  "categories": [
    {
      "id": "CAT-1",
      "name": "Comida",
      "description": "Platos principales y entradas",
      "isActive": true,
      "sortOrder": 1,
      "photoId": null,
      "photo": null,
      "subcategories": [
        {
          "id": "SUB-1",
          "name": "Entradas",
          "description": "Alitas, papas y más",
          "isActive": true,
          "sortOrder": 1,
          "categoryId": "CAT-1",
          "photoId": null,
          "photo": null,
          "products": [
            {
              "id": "PR-39",
              "name": "Alitas",
              "description": "Alitas de pollo preparadas al momento",
              "price": null,
              "hasVariants": true,
              "isActive": true,
              "isPizza": false,
              "sortOrder": 1,
              "subcategoryId": "SUB-1",
              "photoId": null,
              "estimatedPrepTime": 15,
              "preparationScreenId": null,
              "createdAt": "2025-06-24T22:59:49.026Z",
              "updatedAt": "2025-06-24T22:59:49.026Z",
              "deletedAt": null,
              "photo": null,
              "subcategory": null,
              "variants": [
                {
                  "id": "PVA-20",
                  "productId": "PR-39",
                  "name": "Orden de Alitas BBQ",
                  "price": "135.00",
                  "isActive": true,
                  "sortOrder": 1,
                  "createdAt": "2025-06-24T22:59:49.042Z",
                  "updatedAt": "2025-06-24T22:59:49.042Z",
                  "deletedAt": null
                }
              ],
              "modifierGroups": [
                {
                  "id": "MODG-4",
                  "name": "Modificadores Alitas",
                  "description": null,
                  "minSelections": 0,
                  "maxSelections": 4,
                  "isRequired": false,
                  "allowMultipleSelections": true,
                  "isActive": true,
                  "sortOrder": 1,
                  "createdAt": "2025-06-24T22:59:49.184Z",
                  "updatedAt": "2025-06-24T22:59:49.184Z",
                  "deletedAt": null,
                  "productModifiers": [
                    {
                      "id": "MOD-26",
                      "modifierGroupId": "MODG-4",
                      "name": "Extra salsa",
                      "description": null,
                      "price": "10.00",
                      "sortOrder": 1,
                      "isDefault": false,
                      "isActive": true,
                      "createdAt": "2025-06-24T22:59:49.208Z",
                      "updatedAt": "2025-06-24T22:59:49.208Z",
                      "deletedAt": null
                    }
                  ],
                  "products": []
                }
              ],
              "preparationScreen": null,
              "pizzaCustomizations": [],
              "pizzaConfiguration": null
            }
          ],
          "createdAt": "2025-06-24T22:59:47.038Z",
          "updatedAt": "2025-06-24T22:59:47.038Z",
          "deletedAt": null
        }
      ],
      "createdAt": "2025-06-24T22:59:47.016Z",
      "updatedAt": "2025-06-24T22:59:47.016Z",
      "deletedAt": null
    }
  ]
}
```

**Response esperada:**
```json
{
  "success": true,
  "message": "Menu synchronized successfully",
  "itemsProcessed": 150
}
```

### 2. Sincronizar Configuración del Restaurante
**POST** `/api/sync/config`

**Headers:**
```
X-API-Key: 1234
Content-Type: application/json
```

**Body:**
```json
{
  "config": {
    "id": "8cab4144-a72a-4abd-8e1c-6828cd58c31e",
    "restaurantName": "La Leña",
    "phoneMain": "3919160126",
    "phoneSecondary": "3338423316",
    "address": "C. Ogazón Sur 36, Centro",
    "city": "Tototlán",
    "state": "Jalisco",
    "postalCode": "47730",
    "country": "México",
    "acceptingOrders": true,
    "estimatedPickupTime": 20,
    "estimatedDeliveryTime": 40,
    "estimatedDineInTime": 30,
    "openingGracePeriod": 30,
    "closingGracePeriod": 30,
    "timeZone": "America/Mexico_City",
    "deliveryCoverageArea": [
      {"lat": 20.510312180131983, "lng": -102.80972772005968},
      {"lat": 20.507983659683248, "lng": -102.77789898044061},
      {"lat": 20.554751764235842, "lng": -102.77793627062253},
      {"lat": 20.551187113160452, "lng": -102.82100299225554}
    ],
    "businessHours": [
      {
        "id": "49341c20-00aa-4109-8005-49fffed8e18b",
        "dayOfWeek": 0,
        "openingTime": "14:00:00",
        "closingTime": "21:00:00",
        "isClosed": false,
        "restaurantConfigId": "8cab4144-a72a-4abd-8e1c-6828cd58c31e",
        "createdAt": "2025-06-25T06:16:12.348Z",
        "updatedAt": "2025-06-25T06:16:12.348Z",
        "deletedAt": null
      }
    ],
    "createdAt": "2025-06-25T04:59:46.942Z",
    "updatedAt": "2025-06-25T13:18:27.808Z"
  }
}
```

**Response esperada:**
```json
{
  "success": true,
  "message": "Configuration synchronized successfully"
}
```

### 3. Obtener Clientes (Pull)
**GET** `/api/sync/customers?lastSync=2025-06-25T20:00:00.000Z`

**Headers:**
```
X-API-Key: 1234
```

**Response esperada:**
```json
{
  "customers": [
    {
      "id": "uuid-del-cliente",
      "phoneNumber": "+5213331234567",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "addresses": [
        {
          "id": "uuid-de-direccion",
          "customerId": "uuid-del-cliente",
          "street": "Calle Principal 123",
          "neighborhood": "Centro",
          "city": "Tototlán",
          "state": "Jalisco",
          "postalCode": "47730",
          "country": "México",
          "latitude": 20.510312,
          "longitude": -102.809727,
          "references": "Casa azul con portón negro",
          "isDefault": true,
          "createdAt": "2025-06-25T20:00:00.000Z",
          "updatedAt": "2025-06-25T20:00:00.000Z"
        }
      ],
      "sortOrder": 1,
      "createdAt": "2025-06-25T20:00:00.000Z",
      "updatedAt": "2025-06-25T20:00:00.000Z",
      "deletedAt": null
    }
  ],
  "count": 1,
  "lastSync": "2025-06-25T21:00:00.000Z"
}
```

## Implementación Rápida en Express (Backend WhatsApp)

```javascript
// En tu backend de WhatsApp, agrega estas rutas:

// Middleware para verificar API Key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== '1234') {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// Endpoint para recibir el menú
app.post('/api/sync/menu', verifyApiKey, async (req, res) => {
  try {
    const { categories } = req.body;
    
    // Aquí guardas el menú en tu base de datos
    // Por ejemplo, en tu tabla de productos para el bot
    console.log(`Recibidas ${categories.length} categorías del restaurante`);
    
    // Procesar y guardar el menú...
    
    res.json({
      success: true,
      message: 'Menu synchronized successfully',
      itemsProcessed: categories.length
    });
  } catch (error) {
    console.error('Error syncing menu:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para recibir la configuración
app.post('/api/sync/config', verifyApiKey, async (req, res) => {
  try {
    const { config } = req.body;
    
    // Guardar configuración del restaurante
    console.log(`Configuración recibida: ${config.restaurantName}`);
    
    // Procesar horarios, área de cobertura, etc...
    
    res.json({
      success: true,
      message: 'Configuration synchronized successfully'
    });
  } catch (error) {
    console.error('Error syncing config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar clientes
app.get('/api/sync/customers', verifyApiKey, async (req, res) => {
  try {
    const { lastSync } = req.query;
    
    // Aquí obtienes los clientes de tu base de datos
    // que se han actualizado después de lastSync
    const customers = []; // Obtener de tu DB
    
    res.json({
      customers,
      count: customers.length,
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Notas Importantes

1. **IDs únicos**: Los IDs de categorías, productos, etc. tienen formatos específicos:
   - Categorías: `CAT-XXX`
   - Subcategorías: `SUB-XXX`
   - Productos: `PR-XXX`
   - Variantes: `PVA-XXX`
   - Grupos de modificadores: `MODG-XXX`
   - Modificadores: `MOD-XXX`

2. **Precios**: Se envían como strings con 2 decimales (ej: "135.00")

3. **Soft deletes**: El campo `deletedAt` indica si un elemento fue eliminado

4. **Pizza**: Los productos con `isPizza: true` incluyen `pizzaCustomizations` y `pizzaConfiguration`

5. **Imágenes**: El campo `photo` contiene la ruta relativa si existe

## Testing

Puedes probar los endpoints con curl:

```bash
# Probar sincronización de menú
curl -X POST http://localhost:5000/api/sync/menu \
  -H "X-API-Key: 1234" \
  -H "Content-Type: application/json" \
  -d '{"categories":[]}'

# Probar sincronización de configuración
curl -X POST http://localhost:5000/api/sync/config \
  -H "X-API-Key: 1234" \
  -H "Content-Type: application/json" \
  -d '{"config":{}}'

# Obtener clientes
curl -X GET "http://localhost:5000/api/sync/customers?lastSync=2025-06-25T20:00:00.000Z" \
  -H "X-API-Key: 1234"
```