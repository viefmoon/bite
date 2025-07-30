import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Order } from '@/app/schemas/domain/order.schema';
import type {
  Shift,
  OpenShiftDto,
  CloseShiftDto,
  ShiftSummary,
  ShiftOrder,
} from '@/app/schemas/domain/shift.schema';

// Re-export types for external modules
export type { Shift, OpenShiftDto, CloseShiftDto, ShiftSummary, ShiftOrder };

class ShiftsService {
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

  async openShift(data: OpenShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_OPEN, data);
    return response.data;
  }

  async closeShift(data: CloseShiftDto): Promise<Shift> {
    const response = await apiClient.post(API_PATHS.SHIFTS_CLOSE, data);
    return response.data;
  }

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

  async getById(id: string): Promise<Shift> {
    const response = await apiClient.get(
      API_PATHS.SHIFTS_DETAIL.replace(':id', id),
    );
    return response.data;
  }

  async isShiftOpen(): Promise<boolean> {
    const currentShift = await this.getCurrentShift();
    return currentShift !== null && currentShift.status === 'OPEN';
  }

  async getOrdersByShift(shiftId: string): Promise<Order[]> {
    const url = API_PATHS.ORDERS_BY_SHIFT.replace(':shiftId', shiftId);
    const response = await apiClient.get<Order[]>(url);

    return Array.isArray(response.data) ? response.data : [];
  }

  calculateShiftSummary(shift: Shift, orders: Order[]): ShiftSummary {
    const paymentMethodsSummary = new Map<
      string,
      { count: number; total: number }
    >();
    const productsSummary = new Map<
      string,
      { quantity: number; total: number }
    >();

    if (!Array.isArray(orders)) {
      return {
        shift,
        ordersCount: 0,
        totalSales: 0,
        paymentMethodsSummary: [],
        productsSummary: [],
      };
    }

    orders.forEach((order) => {
      const orderTotal = order.total || 0;

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

    const totalSales = orders.reduce((sum, order) => {
      const orderTotal = order.total || 0;
      return sum + orderTotal;
    }, 0);

    return {
      shift,
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
        .slice(0, 10),
    };
  }

  formatOrdersForDetail(orders: Order[]): ShiftOrder[] {
    if (!Array.isArray(orders)) {
      return [];
    }

    return orders.map((order) => {
      const total = order.total || 0;

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
