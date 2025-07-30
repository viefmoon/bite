import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Order } from '@/app/schemas/domain/order.schema';
import type { OrderFilters } from '@/app/types/order-filters.types';

// Order specific types
import type { OrderDetailsForBackend } from '@/modules/orders/utils/orderUtils';
import type { UpdateOrderPayload } from '@/modules/orders/schema/update-order.schema';

/**
 * 🎯 Servicio unificado para todas las operaciones relacionadas con órdenes
 *
 * Consolida funcionalidades de:
 * - orderService (CRUD básico)
 * - orderFinalizationService (finalización)
 * - receiptService (recibos)
 * - shiftsService (órdenes por turno)
 */
export const orderService = {
  // ==========================================
  // 🎯 MÉTODO UNIFICADO (NUEVO)
  // ==========================================

  /**
   * 🚀 Método genérico unificado para obtener órdenes con filtros
   * Reemplaza getOpenOrdersList, getOrdersForFinalizationList,
   * getReceiptsList y getOrdersByShift
   */
  getOrders: async (filters: OrderFilters = {}): Promise<Order[]> => {
    const queryParams: Record<string, any> = {};

    // Filtros por estado
    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      queryParams.status = statuses.join(',');
    }

    // Filtros por turno
    if (filters.shiftId) {
      queryParams.shiftId = filters.shiftId;
    }

    // Filtros por tipo de orden
    if (filters.orderType) {
      const types = Array.isArray(filters.orderType)
        ? filters.orderType
        : [filters.orderType];
      queryParams.orderType = types.join(',');
    }

    // Filtros por fecha
    if (filters.startDate) {
      queryParams.startDate = filters.startDate;
    }
    if (filters.endDate) {
      queryParams.endDate = filters.endDate;
    }

    // Control de campos
    if (filters.includeFields) {
      queryParams.includeFields = filters.includeFields;
    }

    // Paginación
    if (filters.page) {
      queryParams.page = filters.page;
    }
    if (filters.limit) {
      queryParams.limit = filters.limit;
    }

    const response = await apiClient.get<Order[]>(API_PATHS.ORDERS, {
      params: queryParams,
    });

    return Array.isArray(response.data) ? response.data : [];
  },

  // ==========================================
  // 📝 CRUD BÁSICO
  // ==========================================

  /**
   * Crear nueva orden
   */
  createOrder: async (orderData: OrderDetailsForBackend): Promise<Order> => {
    const response = await apiClient.post<Order>(API_PATHS.ORDERS, orderData);
    return response.data;
  },

  /**
   * Obtener orden por ID (genérico)
   */
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
    );
    return response.data;
  },

  /**
   * Actualizar orden
   */
  updateOrder: async (
    orderId: string,
    payload: UpdateOrderPayload,
  ): Promise<Order> => {
    const response = await apiClient.patch<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
      payload,
    );
    return response.data;
  },

  /**
   * Cancelar orden
   */
  cancelOrder: async (orderId: string): Promise<Order> => {
    const payload: UpdateOrderPayload = {
      status: 'CANCELLED',
    };

    const response = await apiClient.patch<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
      payload,
    );
    return response.data;
  },

  // ==========================================
  // ⚡ ACCIONES ESPECIALIZADAS
  // ==========================================

  /**
   * Finalizar múltiples órdenes rápidamente
   */
  quickFinalizeMultipleOrders: async (
    orderIds: string[],
  ): Promise<{ message: string; ordersWithWarnings: string[] }> => {
    const response = await apiClient.post(
      API_PATHS.ORDERS_QUICK_FINALIZE_MULTIPLE,
      { orderIds },
    );
    return response.data;
  },

  /**
   * Recuperar orden (cambiar de CANCELLED a estado anterior)
   */
  recoverOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      API_PATHS.ORDERS_RECOVER.replace(':id', id),
      {},
    );

    return response.data;
  },

  /**
   * Imprimir ticket de orden
   */
  printTicket: async (
    orderId: string,
    params: { printerId: string; ticketType: 'GENERAL' | 'BILLING' },
  ): Promise<void> => {
    await apiClient.post(
      API_PATHS.ORDERS_PRINT_TICKET.replace(':orderId', orderId),
      params,
    );
  },
};

// ==========================================
// 🔧 CONFIGURACIONES DE QUERIES
// ==========================================

/**
 * Keys simplificadas para React Query
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: any) => [...orderKeys.lists(), filters] as const,
  // Mantener keys específicas para compatibilidad con hooks existentes
  openOrdersList: () => [...orderKeys.all, 'list', 'open-orders-list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};
