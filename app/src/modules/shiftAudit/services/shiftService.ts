import apiClient from '@/app/services/apiClient';
import { handleApiResponse } from '@/app/lib/apiHelpers';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Shift, ShiftSummary, ShiftOrder } from '../types';
import type { Order } from '@/app/schemas/domain/order.schema';

interface ShiftHistoryParams {
  limit?: number;
  offset?: number;
}

export const shiftService = {
  /**
   * Obtiene el historial de turnos con paginación
   */
  getHistory: async (params: ShiftHistoryParams = {}): Promise<Shift[]> => {
    const { limit = 30, offset = 0 } = params;
    const response = await apiClient.get<Shift[]>(API_PATHS.SHIFTS_HISTORY, {
      params: { limit, offset },
    });
    return handleApiResponse(response);
  },

  /**
   * Obtiene el turno actual (si existe)
   */
  getCurrentShift: async (): Promise<Shift | null> => {
    const response = await apiClient.get<Shift | null>(
      API_PATHS.SHIFTS_CURRENT,
    );
    return handleApiResponse(response);
  },

  /**
   * Obtiene el detalle de un turno específico
   */
  getShiftById: async (shiftId: string): Promise<Shift> => {
    const url = API_PATHS.SHIFTS_DETAIL.replace(':id', shiftId);
    const response = await apiClient.get<Shift>(url);
    return handleApiResponse(response);
  },

  /**
   * Obtiene todas las órdenes de un turno específico
   */
  getOrdersByShift: async (shiftId: string): Promise<Order[]> => {
    const url = API_PATHS.ORDERS_BY_SHIFT.replace(':shiftId', shiftId);
    const response = await apiClient.get<Order[]>(url);
    return handleApiResponse(response);
  },

  /**
   * Calcula el resumen de un turno con estadísticas
   */
  calculateShiftSummary: (shift: Shift, orders: Order[]): ShiftSummary => {
    const paymentMethodsSummary = new Map<
      string,
      { count: number; total: number }
    >();
    const productsSummary = new Map<
      string,
      { quantity: number; total: number }
    >();

    orders.forEach((order) => {
      // Resumen por método de pago
      if (order.paymentMethod) {
        const current = paymentMethodsSummary.get(order.paymentMethod) || {
          count: 0,
          total: 0,
        };
        paymentMethodsSummary.set(order.paymentMethod, {
          count: current.count + 1,
          total: current.total + order.total,
        });
      }

      // Resumen por productos
      order.items?.forEach((item) => {
        const current = productsSummary.get(item.productName) || {
          quantity: 0,
          total: 0,
        };
        productsSummary.set(item.productName, {
          quantity: current.quantity + item.quantity,
          total: current.total + item.total,
        });
      });
    });

    return {
      shift,
      ordersCount: orders.length,
      totalSales: orders.reduce((sum, order) => sum + order.total, 0),
      paymentMethodsSummary: Array.from(paymentMethodsSummary.entries()).map(
        ([method, data]) => ({
          method,
          count: data.count,
          total: data.total,
        }),
      ),
      productsSummary: Array.from(productsSummary.entries())
        .map(([productName, data]) => ({
          productName,
          quantity: data.quantity,
          total: data.total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10), // Top 10 productos
    };
  },

  /**
   * Formatea las órdenes para mostrar en la vista de detalle
   */
  formatOrdersForDetail: (orders: Order[]): ShiftOrder[] => {
    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber || `#${order.id}`,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || 'Sin pagar',
      customerName: order.customer?.firstName
        ? `${order.customer.firstName} ${order.customer.lastName || ''}`
        : null,
      createdAt: order.createdAt,
      items:
        order.items?.map((item) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          modifiers: item.modifiers?.map((mod) => mod.name),
        })) || [],
    }));
  },
};
