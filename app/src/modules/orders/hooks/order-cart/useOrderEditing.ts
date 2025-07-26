import { useState, useEffect, useCallback } from 'react';
import { useGetOrderByIdQuery } from '../../hooks/useOrdersQueries';
import { useGetOrderMenu } from '../../hooks/useMenuQueries';
import type { CartItem } from '../../stores/useOrderStore';
import type { OrderAdjustment } from '../../schema/adjustments.schema';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';

interface OriginalOrderState {
  items: CartItem[];
  orderType: string;
  tableId: string | null;
  isTemporaryTable: boolean;
  temporaryTableName: string;
  deliveryInfo: DeliveryInfo;
  notes: string;
  scheduledAt: Date | null;
  adjustments: OrderAdjustment[];
}

export const useOrderEditing = (orderId: string | null, visible: boolean) => {
  const [orderDataLoaded, setOrderDataLoaded] = useState(false);
  const [originalOrderState, setOriginalOrderState] =
    useState<OriginalOrderState | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    data: orderData,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
  } = useGetOrderByIdQuery(orderId, {
    enabled: !!orderId && visible,
  });

  const { data: menu } = useGetOrderMenu();

  // Cargar datos de la orden en el estado original
  useEffect(() => {
    if (orderData && !orderDataLoaded && visible) {
      const items: CartItem[] = (orderData.orderItems || []).map((item: any) => {
        const unitPrice = item.variant?.price || item.product.price || 0;
        const modifiers = (item.modifiers || []).map((mod: any) => ({
          id: mod.productModifierId,
          modifierGroupId: mod.modifierGroupId,
          name: mod.productModifier.name,
          price: mod.productModifier.price || 0,
        }));
        const modifiersPrice = modifiers.reduce((sum: number, mod) => sum + mod.price, 0);
        const pizzaExtraCost = item.pizzaExtraCost || 0;
        const totalPrice = (unitPrice + modifiersPrice + pizzaExtraCost) * item.quantity;

        return {
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          unitPrice,
          totalPrice,
          variantId: item.variantId || undefined,
          variantName: item.variant?.name || undefined,
          quantity: item.quantity,
          modifiers,
          preparationNotes: item.preparationNotes || undefined,
          selectedPizzaCustomizations: item.pizzaCustomizations || undefined,
          pizzaExtraCost,
          preparationStatus: item.preparationStatus,
        };
      });

      const adjustments =
        orderData.adjustments?.map((adj: any) => ({
          id: adj.id,
          name: adj.name,
          description: adj.description,
          isPercentage: adj.isPercentage,
          value: adj.value,
          amount: adj.amount,
        })) || [];

      const state: OriginalOrderState = {
        items,
        orderType: orderData.orderType,
        tableId: orderData.tableId ?? null,
        isTemporaryTable: orderData.table?.isTemporary || false,
        temporaryTableName: orderData.table?.name || '',
        deliveryInfo: orderData.deliveryInfo || {},
        notes: orderData.notes || '',
        scheduledAt: orderData.scheduledAt
          ? new Date(orderData.scheduledAt)
          : null,
        adjustments,
      };

      setOriginalOrderState(state);
      setOrderDataLoaded(true);
    }
  }, [orderData, orderDataLoaded, visible]);

  // Detectar cambios no guardados
  const detectUnsavedChanges = useCallback(
    (currentState: Partial<OriginalOrderState>) => {
      if (!originalOrderState) {
        setHasUnsavedChanges(false);
        return false;
      }

      const hasChanges =
        JSON.stringify(currentState.items) !==
          JSON.stringify(originalOrderState.items) ||
        currentState.orderType !== originalOrderState.orderType ||
        currentState.tableId !== originalOrderState.tableId ||
        currentState.isTemporaryTable !== originalOrderState.isTemporaryTable ||
        currentState.temporaryTableName !==
          originalOrderState.temporaryTableName ||
        JSON.stringify(currentState.deliveryInfo) !==
          JSON.stringify(originalOrderState.deliveryInfo) ||
        currentState.notes !== originalOrderState.notes ||
        (currentState.scheduledAt?.getTime() ?? null) !==
          (originalOrderState.scheduledAt?.getTime() ?? null) ||
        JSON.stringify(currentState.adjustments) !==
          JSON.stringify(originalOrderState.adjustments);

      setHasUnsavedChanges(hasChanges);
      return hasChanges;
    },
    [originalOrderState],
  );

  // Resetear estados al cerrar
  const resetEditingState = useCallback(() => {
    setOrderDataLoaded(false);
    setOriginalOrderState(null);
    setHasUnsavedChanges(false);
  }, []);

  // Buscar producto completo en el menú
  const findProductInMenu = useCallback(
    (productId: string) => {
      if (!menu || !Array.isArray(menu)) return null;

      for (const category of menu) {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            if (subcategory.products && Array.isArray(subcategory.products)) {
              const product = subcategory.products.find(
                (p: any) => p.id === productId,
              );
              if (product) return product;
            }
          }
        }
      }
      return null;
    },
    [menu],
  );

  // Preparar items para el backend
  const prepareItemsForBackend = useCallback((items: CartItem[]) => {
    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      modifiers: item.modifiers.map((mod) => ({
        productModifierId: mod.id,
      })),
      preparationNotes: item.preparationNotes || null,
      pizzaCustomizations: item.selectedPizzaCustomizations || [],
      pizzaExtraCost: item.pizzaExtraCost || 0,
    }));
  }, []);

  return {
    orderData,
    isLoadingOrder,
    isErrorOrder,
    orderDataLoaded,
    originalOrderState,
    hasUnsavedChanges,
    detectUnsavedChanges,
    resetEditingState,
    findProductInMenu,
    prepareItemsForBackend,
  };
};
