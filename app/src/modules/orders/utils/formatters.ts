import { OrderTypeEnum, type OrderType } from '../types/orders.types';

/**
 * Información consolidada para estados de orden
 */
export const OrderStatusInfo = {
  getLabel: (status: string): string => {
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
  },
  getColor: (status: string, theme: any): string => {
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
  },
};

/**
 * Información consolidada para estados de preparación de items
 */
export const PreparationStatusInfo = {
  getLabel: (status: string | undefined): string => {
    switch (status) {
      case 'NEW':
        return 'Nuevo';
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En Preparación';
      case 'READY':
        return 'Listo';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status || '';
    }
  },
  getColor: (status: string | undefined, theme: any): string => {
    switch (status) {
      case 'NEW':
        return '#2196F3';
      case 'PENDING':
        return theme.colors.error;
      case 'IN_PROGRESS':
        return '#FFA000';
      case 'READY':
        return '#4CAF50';
      case 'DELIVERED':
        return theme.colors.tertiary;
      case 'CANCELLED':
        return theme.colors.onSurfaceDisabled;
      default:
        return theme.colors.onSurfaceVariant;
    }
  },
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
