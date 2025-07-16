import apiClient from '@/app/services/apiClient';
import { handleApiResponse } from '@/app/lib/apiHelpers';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Shift, ShiftSummary, ShiftOrder } from '../types';
import type { Order } from '@/app/schemas/domain/order.schema';


export const shiftService = {
  /**
   * Obtiene el historial de turnos
   */
  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Shift[]> => {
    try {
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
        
      const response = await apiClient.get<any>(url);

      const rawData = handleApiResponse(response);

      // Asegurar que siempre trabajamos con un array
      let shiftsArray: any[] = [];

      // Si ya es un array, usarlo directamente
      if (Array.isArray(rawData)) {
        shiftsArray = rawData;
      }
      // Si es un objeto, buscar propiedades comunes que contengan arrays
      else if (rawData && typeof rawData === 'object') {
        // Buscar en orden de preferencia
        if (Array.isArray(rawData.data)) {
          shiftsArray = rawData.data;
        } else if (Array.isArray(rawData.items)) {
          shiftsArray = rawData.items;
        } else if (Array.isArray(rawData.results)) {
          shiftsArray = rawData.results;
        } else if (Array.isArray(rawData.shifts)) {
          shiftsArray = rawData.shifts;
        } else {
          // Si no encontramos un array en propiedades conocidas,
          // buscar la primera propiedad que sea un array
          for (const key in rawData) {
            if (Array.isArray(rawData[key])) {
              shiftsArray = rawData[key];
              break;
            }
          }
        }
      }

      // Si es un solo objeto shift, convertirlo en array
      if (
        !Array.isArray(shiftsArray) &&
        shiftsArray &&
        typeof shiftsArray === 'object' &&
        shiftsArray.id
      ) {
        shiftsArray = [shiftsArray];
      }

      // Normalizar cada turno
      const normalizedShifts = shiftsArray.map((shift: any) => ({
        ...shift,
        // Normalizar status
        status: (
          shift.status ||
          shift.shiftStatus ||
          'CLOSED'
        ).toLowerCase() as 'open' | 'closed',
        // Asegurar que los IDs sean strings
        id: String(shift.id),
        // Asegurar que tenemos las propiedades esperadas
        openedBy: shift.openedBy || {
          id: '',
          firstName: 'Usuario',
          lastName: 'Desconocido',
        },
        closedBy: shift.closedBy || null,
        // Asegurar números
        initialCash: Number(shift.initialCash) || 0,
        finalCash: shift.finalCash !== null ? Number(shift.finalCash) : null,
        totalSales: shift.totalSales !== null ? Number(shift.totalSales) : null,
        totalOrders:
          shift.totalOrders !== null ? Number(shift.totalOrders) : null,
        globalShiftNumber: Number(shift.globalShiftNumber) || 0,
        shiftNumber: Number(shift.shiftNumber) || 0,
      }));

      return normalizedShifts;
    } catch (error) {
      console.error('[ShiftService] Error fetching history:', error);
      throw error;
    }
  },

  /**
   * Obtiene el turno actual (si existe)
   */
  getCurrentShift: async (): Promise<Shift | null> => {
    const response = await apiClient.get<any>(API_PATHS.SHIFTS_CURRENT);
    const data = handleApiResponse(response);
    if (!data) return null;

    // Normalizar el status
    return {
      ...data,
      status: data.status?.toLowerCase() || 'closed',
    };
  },

  /**
   * Obtiene el detalle de un turno específico
   */
  getShiftById: async (shiftId: string): Promise<Shift> => {
    const url = API_PATHS.SHIFTS_DETAIL.replace(':id', shiftId);
    const response = await apiClient.get<any>(url);
    const data = handleApiResponse(response);

    // Normalizar el status
    return {
      ...data,
      status: data.status?.toLowerCase() || 'closed',
    };
  },

  /**
   * Obtiene todas las órdenes de un turno específico
   */
  getOrdersByShift: async (shiftId: string): Promise<Order[]> => {
    const url = API_PATHS.ORDERS_BY_SHIFT.replace(':shiftId', shiftId);
    const response = await apiClient.get<any>(url);
    const data = handleApiResponse(response);

    // Asegurar que siempre devuelva un array
    return Array.isArray(data) ? data : data?.data || [];
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

    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array in calculateShiftSummary');
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
        .slice(0, 10), // Top 10 productos
    };
  },

  /**
   * Formatea las órdenes para mostrar en la vista de detalle
   */
  formatOrdersForDetail: (orders: Order[]): ShiftOrder[] => {
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
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
        customerName: order.deliveryInfo?.customerName || null,
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
  },
};
