import { ChangeDetail, BatchOperation } from '../types/orderHistory';

// Type guard para ChangeDetail
export const isChangeDetail = (value: unknown): value is ChangeDetail => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'anterior' in value &&
    'nuevo' in value
  );
};

// Type guard para BatchOperation
export const isBatchOperation = (value: unknown): value is BatchOperation => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'operation' in value &&
    typeof (value as any).operation === 'string'
  );
};

// Utility function para convertir unknown a string para renderizado
export const safeStringify = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Utility function para obtener el segundo elemento de un array diff de forma segura
export const getDiffValue = (
  diffArray: [unknown, unknown] | undefined,
): string => {
  if (!diffArray || !Array.isArray(diffArray) || diffArray.length < 2)
    return '';
  return safeStringify(diffArray[1]);
};

// Utility function para obtener propiedades de objetos unknown de forma segura
export const safeGetProperty = (obj: unknown, key: string): string => {
  if (!obj || typeof obj !== 'object') return '';
  const typedObj = obj as Record<string, unknown>;
  return safeStringify(typedObj[key]);
};

// Utility function para verificar si un array existe y tiene elementos
export const hasArrayItems = (obj: unknown, key: string): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  const typedObj = obj as Record<string, unknown>;
  const arr = typedObj[key];
  return Array.isArray(arr) && arr.length > 0;
};

// Utility function para obtener un array como string separado por comas
export const safeJoinArray = (obj: unknown, key: string): string => {
  if (!obj || typeof obj !== 'object') return '';
  const typedObj = obj as Record<string, unknown>;
  const arr = typedObj[key];
  if (!Array.isArray(arr)) return '';
  return arr.map(safeStringify).join(', ');
};

// Utility function para obtener propiedades anidadas de forma segura
export const safeGetNestedProperty = (
  obj: unknown,
  ...keys: string[]
): string => {
  if (!obj || typeof obj !== 'object') return '';

  let current: unknown = obj;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return '';
    const typedCurrent = current as Record<string, unknown>;
    current = typedCurrent[key];
  }

  return safeStringify(current);
};

// Helper para obtener el icono de la operación
export const getOperationIcon = (
  operation: string,
  type: 'order' | 'item' = 'item',
) => {
  if (type === 'order') {
    return 'receipt';
  }

  switch (operation) {
    case 'INSERT':
      return 'plus';
    case 'UPDATE':
      return 'pencil';
    case 'DELETE':
      return 'delete';
    case 'BATCH':
      return 'folder-multiple';
    default:
      return 'information';
  }
};

// Helper para obtener el label de la operación
export const getOperationLabel = (
  operation: string,
  type: 'order' | 'item' = 'item',
) => {
  if (type === 'order') {
    const orderOperationMap: Record<string, string> = {
      INSERT: 'Orden creada',
      UPDATE: 'Orden modificada',
      DELETE: 'Orden eliminada',
    };
    return orderOperationMap[operation] || operation;
  }

  const itemOperationMap: Record<string, string> = {
    INSERT: 'Item agregado',
    UPDATE: 'Item modificado',
    DELETE: 'Item eliminado',
    BATCH: 'Edición múltiple',
  };
  return itemOperationMap[operation] || operation;
};

// Helper para obtener el color del status de preparación
export const getPreparationStatusColor = (
  status: string,
  theme: any,
): string => {
  const statusColors: Record<string, string> = {
    PENDING: theme.colors.onSurfaceDisabled,
    IN_PROGRESS: theme.colors.warning || '#FFA500',
    READY: theme.colors.success || '#4CAF50',
    CANCELLED: theme.colors.error,
  };
  return statusColors[status] || theme.colors.onSurfaceDisabled;
};

// Helper para formatear nombres de campos
export const formatFieldName = (field: string): string => {
  const fieldMap: Record<string, string> = {
    orderStatus: 'Estado de la orden',
    orderType: 'Tipo de orden',
    tableId: 'Mesa',
    table: 'Mesa',
    notes: 'Notas',
    deliveryInfo: 'Información de entrega',
    customerName: 'Nombre del cliente',
    customerPhone: 'Teléfono del cliente',
    recipientName: 'Nombre del destinatario',
    recipientPhone: 'Teléfono del destinatario',
    deliveryAddress: 'Dirección de entrega',
    fullAddress: 'Dirección',
    estimatedDeliveryTime: 'Tiempo estimado de entrega',
    preparationStatus: 'Estado de preparación',
    preparationNotes: 'Notas de preparación',
    customerId: 'Cliente',
    scheduledAt: 'Fecha programada',
    total: 'Total',
    subtotal: 'Subtotal',
    itemName: 'Nombre del item',
    quantity: 'Cantidad',
    unitPrice: 'Precio unitario',
    totalPrice: 'Precio total',
    modifiers: 'Modificadores',
    customizations: 'Personalizaciones',
    productVariant: 'Variante del producto',
    specialInstructions: 'Instrucciones especiales',
  };
  return fieldMap[field] || field;
};

// Helper para formatear valores
export const formatValue = (
  field: string,
  value: unknown,
  snapshot?: Record<string, unknown>,
): string => {
  if (value === null || value === undefined) return '-';

  switch (field) {
    case 'orderType':
      const typeMap: Record<string, string> = {
        DINE_IN: 'Comer en el local',
        TAKEAWAY: 'Para llevar',
        DELIVERY: 'Delivery',
      };
      return typeMap[String(value)] || String(value);

    case 'orderStatus':
      const statusMap: Record<string, string> = {
        PENDING: 'Pendiente',
        CONFIRMED: 'Confirmada',
        IN_PREPARATION: 'En preparación',
        READY: 'Lista',
        DELIVERED: 'Entregada',
        CANCELLED: 'Cancelada',
      };
      return statusMap[String(value)] || String(value);

    case 'preparationStatus':
      const prepStatusMap: Record<string, string> = {
        PENDING: 'Pendiente',
        IN_PROGRESS: 'En preparación',
        READY: 'Listo',
        CANCELLED: 'Cancelado',
      };
      return prepStatusMap[String(value)] || String(value);

    case 'tableId':
    case 'table':
      if (snapshot && typeof snapshot === 'object') {
        const typedSnapshot = snapshot as Record<string, unknown>;
        if (typedSnapshot.table && typeof typedSnapshot.table === 'object') {
          const table = typedSnapshot.table as Record<string, unknown>;
          if (table.name && typeof table.name === 'string') {
            return table.name;
          }
        }
      }
      return `Mesa ${value}`;

    case 'total':
    case 'subtotal':
    case 'unitPrice':
    case 'totalPrice':
      const num = Number(value);
      return isNaN(num) ? String(value) : `$${num.toFixed(2)}`;

    case 'scheduledAt':
      try {
        const date = new Date(String(value));
        return date.toLocaleString('es-ES');
      } catch {
        return String(value);
      }

    default:
      return String(value);
  }
};
