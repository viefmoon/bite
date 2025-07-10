# Estrategia de Actualización en Tiempo Real - Sistema de Restaurante

## 🎯 Objetivo
Implementar un sistema de actualización en tiempo real para resolver problemas de concurrencia y mantener datos sincronizados entre múltiples usuarios.

## 📊 Análisis de Pantallas Críticas

### 1. **Órdenes Abiertas** (OpenOrdersScreen)
- **Prioridad**: CRÍTICA
- **Datos sensibles**: Estado de órdenes, pagos, asignaciones
- **Frecuencia de actualización recomendada**: 5-10 segundos
- **Eventos clave**: Nueva orden, cambio de estado, nuevo pago

### 2. **Cocina** (KitchenOrdersScreen)
- **Prioridad**: CRÍTICA
- **Datos sensibles**: Órdenes nuevas, cambios de estado
- **Frecuencia de actualización recomendada**: 5 segundos
- **Eventos clave**: Nueva orden, inicio/fin de preparación

### 3. **Pagos** (PaymentModal)
- **Prioridad**: BAJA
- **Datos sensibles**: Pagos realizados, saldo pendiente
- **Frecuencia de actualización recomendada**: Manual o al abrir modal
- **Eventos clave**: Nuevo pago, cancelación de pago
- **Nota**: Generalmente solo un usuario maneja caja, no requiere actualización en tiempo real

### 4. **Finalización** (OrderFinalizationScreen)
- **Prioridad**: ALTA
- **Datos sensibles**: Órdenes pagadas, listas para cerrar
- **Frecuencia de actualización recomendada**: 10-15 segundos
- **Eventos clave**: Orden completamente pagada, orden lista

### 5. **Creación de Órdenes** (CreateOrderScreen)
- **Prioridad**: MEDIA
- **Datos sensibles**: Disponibilidad, precios
- **Frecuencia de actualización recomendada**: 30-60 segundos
- **Eventos clave**: Cambio de disponibilidad, cambio de precio

## 🔧 Soluciones Propuestas

### Opción 1: WebSockets (Recomendada para críticos)

#### ¿Qué son los WebSockets?
WebSockets es un protocolo que permite comunicación **bidireccional en tiempo real** entre cliente y servidor. A diferencia de HTTP donde el cliente siempre pregunta, con WebSockets el servidor puede **enviar datos sin que se los pidan**.

#### Analogía Simple
- **HTTP (Polling)**: Como llamar a un restaurante cada 5 minutos preguntando "¿está lista mi orden?"
- **WebSockets**: Como darle tu número al restaurante y que te llamen cuando esté lista

#### Cómo Funcionaría en tu Sistema

```typescript
// 1. CONEXIÓN INICIAL - La app se conecta al servidor
import { io } from 'socket.io-client';
const socket = io('ws://tu-servidor:3737');

// 2. SERVIDOR ENVÍA EVENTOS - Cuando pasa algo importante
// Backend (cuando se crea una orden):
this.server.emit('order:created', { id: '123', mesa: 5, total: 150 });

// 3. TODAS LAS APPS RECIBEN - Instantáneamente
socket.on('order:created', (orderData) => {
  // La cocina ve la nueva orden
  // Los meseros ven la nueva orden  
  // TODO se actualiza al mismo tiempo
  queryClient.invalidateQueries(['orders']);
});
```

#### Flujo Visual
```
Mesero crea orden → Servidor → WebSocket → TODAS las tablets/apps
                                    ↓
                              Cocina (ve orden)
                              Otros meseros (ven orden)
                              Caja (ve orden)
                              ¡TODO EN TIEMPO REAL!
```

#### Ventajas
- **Instantáneo**: Sin esperar 5-10 segundos
- **Eficiente**: No pregunta constantemente
- **Sincronizado**: Todos ven lo mismo al mismo tiempo
- **Menos datos**: Solo envía cuando hay cambios

### Opción 2: Polling Inteligente (Para datos menos críticos)
```typescript
// En hooks de consulta
export function useKitchenOrders(filters: KitchenFilters) {
  return useQuery({
    queryKey: ['kitchen-orders', filters],
    queryFn: () => kitchenService.getKitchenOrders(filters),
    refetchInterval: 5000, // 5 segundos
    refetchIntervalInBackground: true,
  });
}
```

### Opción 3: Server-Sent Events (SSE)
```typescript
// Para actualizaciones unidireccionales
const eventSource = new EventSource(`${API_URL}/sse/orders`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  queryClient.invalidateQueries(['orders']);
};
```

## 🛡️ Manejo de Concurrencia

### 1. **Bloqueo Optimista para Edición**
```typescript
// Al editar una orden
const updateOrder = async (orderId: string, updates: any) => {
  const currentOrder = queryClient.getQueryData(['orders', orderId]);
  
  try {
    const result = await api.updateOrder(orderId, {
      ...updates,
      version: currentOrder.version // Control de versión
    });
    return result;
  } catch (error) {
    if (error.code === 'VERSION_MISMATCH') {
      // Mostrar diálogo de conflicto
      showConflictDialog(currentOrder, error.latestVersion);
    }
  }
};
```

### 2. **Prevención de Pagos Duplicados**
```typescript
// En PaymentModal
const [isProcessingPayment, setIsProcessingPayment] = useState(false);

const processPayment = async () => {
  if (isProcessingPayment) return; // Prevenir doble clic
  
  setIsProcessingPayment(true);
  
  // Verificar estado actual antes de procesar
  const currentOrder = await api.getOrder(orderId);
  if (currentOrder.totalPaid >= currentOrder.total) {
    showSnackbar('Esta orden ya fue pagada completamente');
    return;
  }
  
  // Procesar pago...
};
```

### 3. **Control de Estado en Cocina**
```typescript
// Validar transiciones de estado
const canTransitionTo = (currentStatus: string, newStatus: string) => {
  const validTransitions = {
    'PENDING': ['IN_PREPARATION', 'CANCELLED'],
    'IN_PREPARATION': ['READY', 'CANCELLED'],
    'READY': ['DELIVERED', 'CANCELLED']
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};
```

## 📈 Plan de Implementación

### Fase 1: Polling Temporal (INMEDIATA - 1 día)
1. Restaurar polling en KitchenOrdersScreen (5 segundos)
2. Agregar polling a OpenOrdersScreen (10 segundos)
3. OrderFinalizationScreen actualizar al abrir (sin polling)

### Fase 2: Infraestructura WebSocket (1-2 semanas)
1. Configurar servidor WebSocket en backend
2. Implementar sistema de eventos
3. Crear hooks reutilizables para suscripciones

### Fase 3: Migración a WebSockets (2 semanas)
1. OpenOrdersScreen - WebSocket para órdenes nuevas y cambios
2. KitchenOrdersScreen - WebSocket para órdenes y estados
3. OrderFinalizationScreen - WebSocket para órdenes completadas

### Fase 4: Optimizaciones (1 semana)
1. Implementar caché inteligente
2. Reducir llamadas redundantes
3. Optimizar rendimiento de actualizaciones

## 🔄 Casos de Uso con WebSockets

### Cocina - Múltiples Tablets
```typescript
// Tablet 1 marca orden como "En preparación"
socket.emit('order:start_preparation', { orderId: '123' });

// TODAS las tablets de cocina reciben:
socket.on('order:preparation_started', (data) => {
  // Actualizar UI mostrando quién está preparando
  showOrderInProgress(data.orderId, data.cookName);
});
```

### Prevención de Trabajo Duplicado
```typescript
// Antes de empezar a preparar
const canStartPreparation = (order) => {
  return order.status === 'PENDING'; // Solo si nadie más la tomó
};

// Si alguien más ya la está preparando
socket.on('order:already_in_preparation', (data) => {
  showAlert(`${data.cookName} ya está preparando esta orden`);
});
```

## 🎨 Indicadores Visuales

### Estados de Sincronización
```typescript
// Mostrar estado de conexión
const ConnectionIndicator = () => {
  const isConnected = useWebSocketConnection();
  
  return (
    <View style={[styles.indicator, { 
      backgroundColor: isConnected ? '#10B981' : '#EF4444' 
    }]}>
      <Text>{isConnected ? '🟢 En línea' : '🔴 Sin conexión'}</Text>
    </View>
  );
};
```

### Indicador de Datos Actualizándose
```typescript
// En cada pantalla crítica
{isFetching && (
  <View style={styles.updateIndicator}>
    <ActivityIndicator size="small" />
    <Text>Actualizando...</Text>
  </View>
)}
```

## ⚡ Mejoras de Rendimiento

1. **Actualización Selectiva**
   - Solo actualizar componentes afectados
   - Usar React.memo en componentes pesados

2. **Debouncing**
   - Agrupar actualizaciones frecuentes
   - Evitar re-renders innecesarios

3. **Caché Inteligente**
   - Mantener datos en memoria
   - Actualizar en background

## 🔍 Monitoreo

1. **Métricas a Rastrear**
   - Latencia de actualizaciones
   - Conflictos de edición
   - Intentos de pagos duplicados
   - Tiempo de sincronización

2. **Alertas**
   - Desconexiones prolongadas
   - Errores de sincronización
   - Conflictos frecuentes

## 🚨 Manejo de Errores

1. **Reconexión Automática**
```typescript
const useAutoReconnect = () => {
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (!isConnected && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        reconnect();
        setRetryCount(prev => prev + 1);
      }, Math.min(1000 * Math.pow(2, retryCount), 30000));
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, retryCount]);
};
```

2. **Modo Offline**
   - Guardar cambios localmente
   - Sincronizar cuando se recupere conexión

## 📋 Checklist de Implementación

- [ ] Configurar infraestructura WebSocket
- [ ] Implementar hooks de suscripción
- [ ] Actualizar OpenOrdersScreen con WebSocket
- [ ] Agregar polling a KitchenOrdersScreen
- [ ] Sincronizar PaymentModal en tiempo real
- [ ] Implementar bloqueo optimista en edición
- [ ] Agregar indicadores visuales de estado
- [ ] Configurar reconexión automática
- [ ] Implementar modo offline básico
- [ ] Agregar métricas y monitoreo
- [ ] Realizar pruebas de concurrencia
- [ ] Optimizar rendimiento