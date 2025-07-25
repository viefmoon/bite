import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { ShiftSummary, ShiftOrder } from '@/modules/shiftAudit/types';
import type { Order } from '@/app/schemas/domain/order.schema';

export interface ShiftStatus {
  OPEN: 'OPEN';
  CLOSED: 'CLOSED';
}

export interface Shift {
  id: string;
  date: string;
  globalShiftNumber: number;
  shiftNumber: number;
  status: keyof ShiftStatus;
  openedAt: string;
  closedAt: string | null;
  openedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  closedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  initialCash: number;
  finalCash: number | null;
  totalSales: number | null;
  totalOrders: number | null;
  cashDifference: number | null;
  expectedCash?: number | null;
  notes: string | null;
  closeNotes: string | null;
}

export interface OpenShiftDto {
  initialCash: number;
  notes?: string;
  date?: string;
}

export interface CloseShiftDto {
  finalCash: number;
  closeNotes?: string;
}

class ShiftsService {
  /**
   * Obtener el turno actual
   */
  async getCurrentShift(): Promise<Shift | null> {
    try {
      const response = await apiClient.get(API_PATHS.SHIFTS_CURRENT);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Abrir un nuevo turno
   */
  async openShift(data: OpenShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_OPEN, data);
    return response.data;
  }

  /**
   * Cerrar el turno actual
   */
  async closeShift(data: CloseShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_CLOSE, data);
    return response.data;
  }

  /**
   * Obtener historial de turnos
   */
  async getHistory(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Shift[]> {
    const queryParams = new URLSearchParams();

    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    const url = queryParams.toString()
      ? `${API_PATHS.SHIFTS_HISTORY}?${queryParams.toString()}`
      : API_PATHS.SHIFTS_HISTORY;

    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Obtener un turno por ID
   */
  async getById(id: string): Promise<Shift> {
    const response = await apiClient.get(
      API_PATHS.SHIFTS_DETAIL.replace(':id', id),
    );
    return response.data;
  }

  /**
   * Verificar si hay un turno abierto
   */
  async isShiftOpen(): Promise<boolean> {
    const currentShift = await this.getCurrentShift();
    return currentShift !== null && currentShift.status === 'OPEN';
  }

  /**
   * Obtiene todas las órdenes de un turno específico
   */
  async getOrdersByShift(shiftId: string): Promise<Order[]> {
    const url = API_PATHS.ORDERS_BY_SHIFT.replace(':shiftId', shiftId);
    const response = await apiClient.get<Order[]>(url);

    // Asegurar que siempre devuelva un array
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Calcula el resumen de un turno con estadísticas
   */
  calculateShiftSummary(shift: Shift, orders: Order[]): ShiftSummary {
    // Normalizar el shift para que sea compatible con el tipo ShiftSummary
    const normalizedShift = {
      ...shift,
      status: shift.status === 'OPEN' ? ('open' as const) : ('closed' as const),
    };
    const paymentMethodsSummary = new Map<
      string,
      { count: number; total: number }
    >();
    const productsSummary = new Map<
      string,
      { quantity: number; total: number }
    >();

    if (!Array.isArray(orders)) {
      // Orders no es un array en calculateShiftSummary
      return {
        shift,
        ordersCount: 0,
        totalSales: 0,
        paymentMethodsSummary: [],
        productsSummary: [],
      };
    }

    orders.forEach((order) => {
      // Calcular el total de la orden
      const orderTotal =
        typeof order.total === 'number'
          ? order.total
          : typeof order.total === 'string'
            ? parseFloat(order.total)
            : 0;

      // Resumen por método de pago
      let paymentMethod = 'Sin pagar';
      if (order.payments && order.payments.length > 0) {
        paymentMethod = order.payments[0].paymentMethod || 'Efectivo';
      }

      const current = paymentMethodsSummary.get(paymentMethod) || {
        count: 0,
        total: 0,
      };
      paymentMethodsSummary.set(paymentMethod, {
        count: current.count + 1,
        total: current.total + orderTotal,
      });

      // Resumen por productos
      order.orderItems?.forEach((item: any) => {
        const productName =
          item.product?.name || item.productName || 'Producto';
        const itemTotal = item.total || item.quantity * item.unitPrice || 0;
        const current = productsSummary.get(productName) || {
          quantity: 0,
          total: 0,
        };
        productsSummary.set(productName, {
          quantity: current.quantity + (item.quantity || 1),
          total: current.total + itemTotal,
        });
      });
    });

    // Calcular el total de ventas correctamente
    const totalSales = orders.reduce((sum, order) => {
      const orderTotal =
        typeof order.total === 'number'
          ? order.total
          : typeof order.total === 'string'
            ? parseFloat(order.total)
            : 0;
      return sum + orderTotal;
    }, 0);

    return {
      shift: normalizedShift,
      ordersCount: orders.length,
      totalSales: totalSales,
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
  }

  /**
   * Formatea las órdenes para mostrar en la vista de detalle
   */
  formatOrdersForDetail(orders: Order[]): ShiftOrder[] {
    if (!Array.isArray(orders)) {
      // Orders no es un array
      return [];
    }

    return orders.map((order) => {
      // Calcular el total si no está definido
      const total =
        typeof order.total === 'number'
          ? order.total
          : typeof order.total === 'string'
            ? parseFloat(order.total)
            : 0;

      // Determinar el método de pago
      let paymentMethod = 'Sin pagar';
      if (order.payments && order.payments.length > 0) {
        paymentMethod = order.payments[0].paymentMethod || 'Efectivo';
      }

      return {
        id: order.id,
        orderNumber:
          order.orderNumber || `#${order.shiftOrderNumber || order.id}`,
        total: total,
        status: order.orderStatus || 'COMPLETED',
        paymentMethod: paymentMethod,
        customerName: (order.deliveryInfo as any)?.customerName || null,
        createdAt:
          typeof order.createdAt === 'string'
            ? order.createdAt
            : order.createdAt.toISOString(),
        items:
          order.orderItems?.map((item: any) => ({
            id: item.id || String(Math.random()),
            productName: item.product?.name || item.productName || 'Producto',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            total: item.total || item.quantity * item.unitPrice || 0,
            modifiers:
              item.productModifiers?.map(
                (mod: any) => mod.modifierName || mod.name,
              ) || [],
          })) || [],
      };
    });
  }
}

export const shiftsService = new ShiftsService();
