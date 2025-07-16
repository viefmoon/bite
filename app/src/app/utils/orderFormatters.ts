import type {
  OrderStatus,
  OrderType,
  Order,
} from '@/modules/orders/types/orders.types';
import {
  OrderStatusEnum,
  OrderTypeEnum,
} from '@/modules/orders/types/orders.types';
import type { OrderOpenList } from '@/modules/orders/types/orders.types';
import type { OrderForFinalizationList } from '@/modules/orderFinalization/types/orderFinalization.types';

/**
 * Formatea el tipo de orden con emojis y texto completo
 * @param type - Tipo de orden
 * @returns String formateado con emoji y texto
 */
export const formatOrderType = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return '🍽️ Para Comer Aquí';
    case OrderTypeEnum.TAKE_AWAY:
      return '🥡 Para Llevar';
    case OrderTypeEnum.DELIVERY:
      return '🚚 Domicilio';
    default:
      return type;
  }
};

/**
 * Formatea el tipo de orden con versión corta
 * @param type - Tipo de orden
 * @returns String formateado con emoji y texto corto
 */
export const formatOrderTypeShort = (type: OrderType | string): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
    case 'DINE_IN':
      return '🍽️ Local';
    case OrderTypeEnum.TAKE_AWAY:
    case 'TAKE_AWAY':
    case 'TAKEOUT': // Para compatibilidad
      return '🥡 Llevar';
    case OrderTypeEnum.DELIVERY:
    case 'DELIVERY':
      return '🚚 Envío';
    default:
      return type;
  }
};

/**
 * Formatea el estado de la orden
 * @param status - Estado de la orden
 * @returns String formateado en español
 */
export const formatOrderStatus = (status: OrderStatus | string): string => {
  switch (status) {
    case OrderStatusEnum.PENDING:
    case 'PENDING':
      return 'Pendiente';
    case OrderStatusEnum.IN_PROGRESS:
    case 'IN_PROGRESS':
      return 'En Progreso';
    case OrderStatusEnum.IN_PREPARATION:
    case 'IN_PREPARATION':
      return 'En Preparación';
    case OrderStatusEnum.READY:
    case 'READY':
      return 'Lista';
    case OrderStatusEnum.DELIVERED:
    case 'DELIVERED':
      return 'Entregada';
    case OrderStatusEnum.COMPLETED:
    case 'COMPLETED':
      return 'Completada';
    case OrderStatusEnum.CANCELLED:
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
};

/**
 * Formatea el estado de la orden (versión alternativa para compatibilidad)
 * Esta versión usa textos ligeramente diferentes
 * @param status - Estado de la orden
 * @returns String formateado en español
 */
export const formatOrderStatusAlt = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En preparación';
    case 'READY':
      return 'Listo';
    case 'DELIVERED':
      return 'Entregado';
    default:
      return status;
  }
};

/**
 * Obtiene el color para el estado de la orden
 * @param status - Estado de la orden
 * @param theme - Tema de la aplicación (opcional, para algunos colores)
 * @returns Color hex o referencia al tema
 */
export const getStatusColor = (
  status: OrderStatus | string,
  theme?: any,
): string => {
  switch (status) {
    case OrderStatusEnum.PENDING:
    case 'PENDING':
      return '#FFA000'; // Orange
    case OrderStatusEnum.IN_PROGRESS:
    case 'IN_PROGRESS':
      return theme?.colors?.primary || '#6200EE';
    case OrderStatusEnum.READY:
    case 'READY':
      return '#4CAF50'; // Green
    case OrderStatusEnum.DELIVERED:
    case 'DELIVERED':
      return theme?.colors?.tertiary || '#9C27B0'; // Purple
    default:
      return theme?.colors?.onSurfaceVariant || '#757575';
  }
};

/**
 * Determina el estado de pago de una orden
 * @param order - Orden completa o de lista
 * @returns Estado del pago: 'unpaid' | 'partial' | 'paid'
 */
export const getPaymentStatus = (
  order: Order | OrderOpenList | OrderForFinalizationList,
): 'unpaid' | 'partial' | 'paid' => {
  // Verificar que order existe
  if (!order) {
    return 'unpaid';
  }

  // Si es OrderOpenList o OrderForFinalizationList, usar paymentsSummary
  if ('paymentsSummary' in order) {
    const totalPaid = order.paymentsSummary?.totalPaid || 0;
    const orderTotal =
      typeof order.total === 'string'
        ? parseFloat(order.total)
        : order.total || 0;

    if (totalPaid >= orderTotal) {
      return 'paid';
    } else if (totalPaid > 0) {
      return 'partial';
    } else {
      return 'unpaid';
    }
  }

  // Si es Order completa, usar payments
  if (!order.payments || order.payments.length === 0) {
    return 'unpaid';
  }

  // Sumar todos los pagos completados
  const totalPaid = order.payments
    .filter((payment: any) => payment.paymentStatus === 'COMPLETED')
    .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

  const orderTotal =
    typeof order.total === 'string'
      ? parseFloat(order.total)
      : order.total || 0;

  if (totalPaid === 0) {
    return 'unpaid';
  } else if (totalPaid >= orderTotal) {
    return 'paid';
  } else {
    return 'partial';
  }
};

/**
 * Obtiene el color para el estado de pago
 * @param paymentStatus - Estado del pago
 * @returns Color hex
 */
export const getPaymentStatusColor = (
  paymentStatus: 'unpaid' | 'partial' | 'paid',
): string => {
  switch (paymentStatus) {
    case 'paid':
      return '#10B981'; // Green
    case 'partial':
      return '#F59E0B'; // Amber
    case 'unpaid':
      return '#EF4444'; // Red
    default:
      return '#757575'; // Gray
  }
};

/**
 * Formatea el texto del estado de pago
 * @param paymentStatus - Estado del pago
 * @returns Texto formateado con emoji
 */
export const formatPaymentStatus = (
  paymentStatus: 'unpaid' | 'partial' | 'paid',
): string => {
  switch (paymentStatus) {
    case 'paid':
      return '💵 Pagado';
    case 'partial':
      return '💵 Parcial';
    case 'unpaid':
      return '💵 Pendiente';
    default:
      return '💵 Desconocido';
  }
};
