/**
 * 🎯 Tipos unificados para filtros de órdenes
 *
 * Consolida filtros de:
 * - Finalización (status abiertos)
 * - Recibos (status cerrados)
 * - Shifts (por turno)
 */

export type OrderStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'IN_PREPARATION'
  | 'READY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY';

/**
 * Nivel de detalle de campos a incluir
 */
export type IncludeFields =
  | 'minimal' // Solo campos para listas
  | 'standard' // Campos estándar
  | 'complete'; // Todos los campos

/**
 * Filtros principales para consultas de órdenes
 */
export interface OrderFilters {
  // Filtros por estado
  status?: OrderStatus | OrderStatus[];

  // Filtros por turno
  shiftId?: string;

  // Filtros por tipo
  orderType?: OrderType | OrderType[];

  // Filtros por fecha
  startDate?: string;
  endDate?: string;

  // Control de campos
  includeFields?: IncludeFields;

  // Paginación (opcional para futuro)
  page?: number;
  limit?: number;
}

/**
 * Presets comunes para diferentes secciones
 */
export const ORDER_FILTER_PRESETS = {
  // Para sección de finalización
  forFinalization: (): OrderFilters => ({
    status: ['PENDING', 'IN_PROGRESS', 'IN_PREPARATION', 'READY'],
    includeFields: 'minimal',
  }),

  // Para sección de recibos
  receipts: (filters?: {
    startDate?: string;
    endDate?: string;
    orderType?: OrderType;
  }): OrderFilters => ({
    status: ['COMPLETED', 'CANCELLED'],
    includeFields: 'minimal',
    ...filters,
  }),

  // Para órdenes de un turno específico
  byShift: (shiftId: string): OrderFilters => ({
    shiftId,
    includeFields: 'minimal',
  }),

  // Para órdenes abiertas
  open: (): OrderFilters => ({
    status: ['PENDING', 'IN_PROGRESS', 'IN_PREPARATION', 'READY'],
    includeFields: 'minimal',
  }),
};

/**
 * Respuesta unificada de lista de órdenes
 */
export interface OrdersListResponse<T = any> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
