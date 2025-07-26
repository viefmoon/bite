import { useMemo } from 'react';
import type { CartItem } from '../stores/useOrderCreationStore';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import type { Payment } from '../schema/payment.schema';
import { PaymentStatusEnum } from '../schema/payment.schema';

interface UseOrderCalculationsProps {
  items: CartItem[];
  adjustments?: OrderAdjustment[];
  payments?: Payment[];
}

interface UseOrderCalculationsReturn {
  subtotal: number;
  adjustmentTotal: number;
  total: number;
  totalPaid: number;
  remainingAmount: number;
  hasPayments: boolean;
  canMakePayment: boolean;
  calculateItemTotal: (item: CartItem) => number;
  calculateAdjustmentAmount: (
    adjustment: OrderAdjustment,
    subtotal: number,
  ) => number;
}

export const useOrderCalculations = ({
  items,
  adjustments = [],
  payments = [],
}: UseOrderCalculationsProps): UseOrderCalculationsReturn => {
  // Función para calcular el total de un item
  const calculateItemTotal = (item: CartItem): number => {
    // Si el item ya tiene totalPrice calculado, usarlo
    if (
      item.totalPrice !== undefined &&
      item.totalPrice !== null &&
      !isNaN(item.totalPrice)
    ) {
      return item.totalPrice;
    }

    // Si no, calcularlo basado en unitPrice
    const basePrice = item.unitPrice || 0;
    const modifiersTotal = item.modifiers.reduce(
      (sum, modifier) => sum + (modifier.price || 0),
      0,
    );
    return (basePrice + modifiersTotal) * item.quantity;
  };

  // Función para calcular el monto de un ajuste
  const calculateAdjustmentAmount = (
    adjustment: OrderAdjustment,
    subtotal: number,
  ): number => {
    if (adjustment.isPercentage && adjustment.value !== undefined) {
      return (subtotal * adjustment.value) / 100;
    }
    return adjustment.amount || 0;
  };

  // Calcular subtotal (suma de todos los items)
  const subtotal = useMemo(() => {
    const total = items.reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item);
      // Verificar que no sea NaN
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
    return isNaN(total) ? 0 : total;
  }, [items]);

  // Calcular total de ajustes
  const adjustmentTotal = useMemo(() => {
    return adjustments.reduce((total, adjustment) => {
      const amount = calculateAdjustmentAmount(adjustment, subtotal);
      return total + amount;
    }, 0);
  }, [adjustments, subtotal]);

  // Calcular total final
  const total = useMemo(() => {
    const finalTotal = subtotal + adjustmentTotal;
    return Math.max(0, finalTotal); // No permitir totales negativos
  }, [subtotal, adjustmentTotal]);

  // Calcular total pagado (solo pagos completados o pendientes)
  const totalPaid = useMemo(() => {
    return payments
      .filter(
        (payment) =>
          payment.status === PaymentStatusEnum.COMPLETED ||
          payment.status === PaymentStatusEnum.PENDING,
      )
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  // Calcular monto restante
  const remainingAmount = useMemo(() => {
    return Math.max(0, total - totalPaid);
  }, [total, totalPaid]);

  // Verificar si hay pagos
  const hasPayments = useMemo(() => {
    return payments.length > 0;
  }, [payments]);

  // Verificar si se puede hacer un pago
  const canMakePayment = useMemo(() => {
    return total > 0 && remainingAmount > 0;
  }, [total, remainingAmount]);

  return {
    subtotal,
    adjustmentTotal,
    total,
    totalPaid,
    remainingAmount,
    hasPayments,
    canMakePayment,
    calculateItemTotal,
    calculateAdjustmentAmount,
  };
};
