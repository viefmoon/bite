import { OrderTypeEnum, type OrderType } from '../types/orders.types';

/**
 * Obtiene el color correspondiente al estado de una orden
 */
export const getOrderStatusColor = (status: string, theme: any): string => {
  switch (status) {
    case 'PENDING':
      return '#FFA000';
    case 'IN_PROGRESS':
      return theme.colors.primary;
    case 'IN_PREPARATION':
      return '#FF6B35';
    case 'READY':
      return '#4CAF50';
    case 'DELIVERED':
      return theme.colors.tertiary;
    case 'COMPLETED':
      return '#10B981';
    case 'CANCELLED':
      return theme.colors.error;
    default:
      return theme.colors.onSurfaceVariant;
  }
};

/**
 * Formatea el estado de una orden a texto legible
 */
export const formatOrderStatus = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'IN_PROGRESS':
      return 'En Progreso';
    case 'IN_PREPARATION':
      return 'En Preparación';
    case 'READY':
      return 'Lista';
    case 'DELIVERED':
      return 'Entregada';
    case 'COMPLETED':
      return 'Completada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status;
  }
};

/**
 * Formatea el estado de preparación de un item
 */
export const getPreparationStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En preparación',
    READY: 'Listo',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    NEW: 'Nuevo',
  };

  return statusMap[status] || status;
};

/**
 * Obtiene el color para el estado de preparación
 */
export const getPreparationStatusColor = (
  status: string,
  theme: any,
): string => {
  const colorMap: Record<string, string> = {
    PENDING: theme.colors.onSurfaceVariant,
    IN_PROGRESS: theme.colors.primary,
    READY: '#4CAF50',
    DELIVERED: theme.colors.tertiary,
    CANCELLED: theme.colors.error,
    NEW: theme.colors.secondary,
  };

  return colorMap[status] || theme.colors.onSurfaceVariant;
};

/**
 * Formatea el tipo de orden a texto legible
 */
export const formatOrderType = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return 'Comer en Local';
    case OrderTypeEnum.TAKE_AWAY:
      return 'Para Llevar';
    case OrderTypeEnum.DELIVERY:
      return 'Delivery';
    default:
      return type;
  }
};

/**
 * Formatea el tipo de orden a texto corto
 */
export const formatOrderTypeShort = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return 'Local';
    case OrderTypeEnum.TAKE_AWAY:
      return 'Llevar';
    case OrderTypeEnum.DELIVERY:
      return 'Delivery';
    default:
      return type;
  }
};

/**
 * Obtiene el ícono para el tipo de orden
 */
export const getOrderTypeIcon = (type: OrderType): string => {
  switch (type) {
    case OrderTypeEnum.DINE_IN:
      return 'silverware-fork-knife';
    case OrderTypeEnum.TAKE_AWAY:
      return 'bag-checked';
    case OrderTypeEnum.DELIVERY:
      return 'moped';
    default:
      return 'help-circle';
  }
};

/**
 * Formatea el método de pago
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  };

  return methodMap[method] || method;
};

/**
 * Obtiene el ícono para el método de pago
 */
export const getPaymentMethodIcon = (method: string): string => {
  const iconMap: Record<string, string> = {
    CASH: 'cash',
    CARD: 'credit-card',
    TRANSFER: 'bank-transfer',
  };

  return iconMap[method] || 'help-circle';
};

/**
 * Obtiene el estado de pago basado en la información de la orden
 */
export const getPaymentStatus = (
  order: any,
): { status: 'paid' | 'partial' | 'unpaid'; label: string } => {
  const total = order.total || 0;
  const paidAmount = order.totalPaidAmount || 0;

  if (paidAmount >= total) {
    return { status: 'paid', label: 'Pagado' };
  } else if (paidAmount > 0) {
    return { status: 'partial', label: 'Pago Parcial' };
  } else {
    return { status: 'unpaid', label: 'Sin Pagar' };
  }
};

/**
 * Obtiene el color para el estado del pago
 */
export const getStatusColor = (
  status: 'paid' | 'partial' | 'unpaid',
  theme: any,
): string => {
  switch (status) {
    case 'paid':
      return '#4CAF50';
    case 'partial':
      return '#FF9800';
    case 'unpaid':
      return theme.colors.error;
    default:
      return theme.colors.onSurfaceVariant;
  }
};
