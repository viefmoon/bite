import { useMemo } from 'react';
import type { CartItem } from '../../stores/useOrderCreationStore';
import type { OrderAdjustment } from '../../schema/adjustments.schema';

export const useOrderCalculations = (
  items: CartItem[],
  adjustments: OrderAdjustment[] = [],
) => {
  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const basePrice = item.variantPrice || item.productPrice;
      const modifiersPrice = item.modifiers.reduce(
        (sum, mod) => sum + (mod.price || 0),
        0,
      );
      const pizzaExtraCost = item.pizzaExtraCost || 0;
      const itemTotal =
        (basePrice + modifiersPrice + pizzaExtraCost) * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [items]);

  const adjustmentsTotal = useMemo(() => {
    return adjustments.reduce((total, adjustment) => {
      if (adjustment.isPercentage && adjustment.value) {
        // Para porcentajes, calcular basado en el subtotal
        return total + (subtotal * adjustment.value) / 100;
      } else if (adjustment.amount) {
        // Para montos fijos
        return total + adjustment.amount;
      }
      return total;
    }, 0);
  }, [adjustments, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - adjustmentsTotal);
  }, [subtotal, adjustmentsTotal]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const hasItems = items.length > 0;

  return {
    subtotal,
    adjustmentsTotal,
    total,
    totalItemsCount,
    hasItems,
  };
};
