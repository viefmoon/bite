# Sistema de Manejo de Errores de Red

## Problema Original
- El interceptor de axios no mostraba los snackbars de error
- Los arrays vacíos se interpretaban como errores
- El proxy del apiClient causaba loops infinitos
- No se diferenciaba entre "sin datos" y "error de conexión"

## Solución Implementada

### 1. **Proxy Mejorado del API Client**
```typescript
// Cache para el cliente inicializado
let cachedClient: any = null;

// Función wrapper que devuelve el cliente real
const createApiClientWrapper = () => {
  const handler = {
    get(_target: any, prop: string) {
      // Retornar una función que inicializa el cliente cuando se necesita
      return async (...args: any[]) => {
        if (!cachedClient) {
          cachedClient = await getApiClient();
        }
        
        const method = cachedClient[prop];
        if (typeof method === 'function') {
          return method.apply(cachedClient, args);
        }
        
        return method;
      };
    }
  };
  
  return new Proxy({}, handler);
};
```

**Por qué funciona:**
- Evita loops infinitos al no ser asíncrono el handler `get`
- Cachea el cliente para evitar múltiples inicializaciones
- Retorna funciones wrapper en lugar de promesas

### 2. **Interceptor de Axios para Errores de Red**
```typescript
// En el interceptor de respuestas
if (!error.response) {
  // Error de red detectado
  const showSnackbar = useSnackbarStore.getState().showSnackbar;
  
  let errorMessage = 'Sin conexión al servidor';
  if (originalRequest.method === 'POST') {
    errorMessage = 'No se puede guardar sin conexión';
  } else if (originalRequest.method === 'PUT') {
    errorMessage = 'No se puede actualizar sin conexión';
  } else if (originalRequest.method === 'DELETE') {
    errorMessage = 'No se puede eliminar sin conexión';
  } else if (originalRequest.method === 'GET') {
    errorMessage = 'No se pueden cargar los datos sin conexión';
  }
  
  showSnackbar({
    message: errorMessage,
    type: 'error',
    duration: 5000,
  });
  
  const apiError = ApiError.fromAxiosError(error);
  return Promise.reject(apiError);
}
```

### 3. **Transform de Apisauce para Casos Especiales**
```typescript
function addResponseTransforms(client: any) {
  client.addResponseTransform((response: any) => {
    // Si hay un problema de red, mostrar snackbar aquí también
    if (response.problem === 'NETWORK_ERROR' || 
        response.problem === 'TIMEOUT_ERROR' || 
        response.problem === 'CONNECTION_ERROR' || 
        (!response.ok && !response.status)) {
      
      const showSnackbar = useSnackbarStore.getState().showSnackbar;
      // ... código para mostrar snackbar
      
      // Usar setTimeout para asegurar que se muestre
      setTimeout(() => {
        showSnackbar({ message: errorMessage, type: 'error', duration: 5000 });
      }, 100);
    }
  });
}
```

### 4. **Manejo Correcto de Arrays Vacíos**
```typescript
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  // Caso especial: si data es un array vacío, es una respuesta válida
  if (response.ok && Array.isArray(response.data) && response.data.length === 0) {
    return response.data;
  }
  
  if (!response.ok || !response.data) {
    // Manejo de errores...
  }
  
  return response.data;
}
```

### 5. **Indicador de Conexión No Bloqueante**
- Ícono en el header que muestra el estado de conexión
- Colores distintivos para cada estado
- No bloquea la UI, solo informa

## Aplicación en Otros Módulos

Para aplicar este sistema en otros módulos:

1. **Usar siempre `handleApiResponse`**:
```typescript
async getSomeData(): Promise<Data[]> {
  const response = await apiClient.get<Data[]>(API_PATHS.SOME_PATH);
  return handleApiResponse(response);
}
```

2. **Configurar `useListState` con mensajes de error personalizados**:
```typescript
const { ListEmptyComponent } = useListState({
  isLoading,
  isError,
  data: items,
  emptyConfig: {
    title: 'No hay elementos',
    message: 'No se encontraron elementos.',
    icon: 'folder-open',
  },
  errorConfig: {
    title: 'Error al cargar',
    message: 'No se pudieron cargar los datos. Verifica tu conexión.',
    icon: 'wifi-off',
    actionLabel: 'Reintentar',
    onAction: () => refetch(),
  },
});
```

3. **Desestructurar `isError` de los hooks de React Query**:
```typescript
const { data, isLoading, isError, refetch } = useGetDataQuery();
```

## Ventajas del Sistema

1. **No bloqueante**: El usuario puede continuar trabajando
2. **Mensajes específicos**: Diferentes mensajes según el tipo de operación
3. **Feedback visual claro**: Snackbars e indicador de conexión
4. **Diferenciación correcta**: Entre "sin datos" y "error de conexión"
5. **Retry automático**: Con axios-retry para errores temporales
6. **Sin loops infinitos**: Proxy mejorado que evita llamadas recursivas

## Debugging

Si necesitas debuggear, puedes temporalmente agregar logs en:
- `apiClient.ts` - En el wrapper del proxy
- `handleApiResponse` - Para ver las respuestas
- Transform de apisauce - Para ver problemas de red
- Servicios específicos - Para rastrear llamadas

Recuerda quitar los logs después de debuggear.