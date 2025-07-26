import { useEffect, useCallback } from 'react';
import type { CartItem } from '../stores/useOrderCreationStore';
import type { OrderAdjustment } from '../schema/adjustments.schema';
import type { DeliveryInfo } from '@/app/schemas/domain/delivery-info.schema';
import type { OrderType } from '../types/orders.types';
import { useFullMenuQuery } from '@/modules/products/hooks/useFullMenuQuery';

interface CartItemModifier {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number;
}

interface OrderDataLoaderProps {
  isEditMode: boolean;
  orderData: any;
  visible: boolean;
  setEditOrderType: (orderType: OrderType) => void;
  setEditSelectedTableId: (tableId: string | null) => void;
  setEditScheduledTime: (time: Date | null) => void;
  setEditDeliveryInfo: (info: DeliveryInfo) => void;
  setEditOrderNotes: (notes: string) => void;
  setEditAdjustments: (adjustments: OrderAdjustment[]) => void;
  setEditSelectedAreaId: (areaId: string | null) => void;
  setEditIsTemporaryTable: (isTemporary: boolean) => void;
  setEditTemporaryTableName: (name: string) => void;
  setEditItems: (items: CartItem[]) => void;
  setOrderDataLoaded: (loaded: boolean) => void;
  setOriginalOrderState: (state: any) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const useOrderDataLoader = ({
  isEditMode,
  orderData,
  visible,
  setEditOrderType,
  setEditSelectedTableId,
  setEditScheduledTime,
  setEditDeliveryInfo,
  setEditOrderNotes,
  setEditAdjustments,
  setEditSelectedAreaId,
  setEditIsTemporaryTable,
  setEditTemporaryTableName,
  setEditItems,
  setOrderDataLoaded,
  setOriginalOrderState,
  setHasUnsavedChanges,
}: OrderDataLoaderProps) => {
  const { data: fullMenuData } = useFullMenuQuery();

  const findModifierById = useCallback(
    (modifierId: string) => {
      if (!fullMenuData) return null;

      for (const product of fullMenuData) {
        for (const group of product.modifierGroups || []) {
          for (const modifier of group.modifiers || []) {
            if (modifier.id === modifierId) {
              return {
                id: modifier.id,
                modifierGroupId: group.id,
                name: modifier.name,
                price: modifier.price,
              };
            }
          }
        }
      }
      return null;
    },
    [fullMenuData],
  );

  useEffect(() => {
    if (!isEditMode || !orderData || !visible) return;

    setEditOrderType(orderData.orderType);
    setEditSelectedTableId(orderData.tableId ?? null);
    setEditScheduledTime(
      orderData.scheduledAt ? new Date(orderData.scheduledAt) : null,
    );
    setEditDeliveryInfo(orderData.deliveryInfo || {});
    setEditOrderNotes(orderData.notes ?? '');

    if (orderData.adjustments && Array.isArray(orderData.adjustments)) {
      const mappedAdjustments = orderData.adjustments.map((adj: any) => ({
        id: adj.id,
        name: adj.name,
        description: adj.description || '',
        isPercentage: adj.isPercentage,
        value: adj.value,
        amount: adj.amount,
        isDeleted: false,
        isNew: false,
      }));
      setEditAdjustments(mappedAdjustments);
    } else {
      setEditAdjustments([]);
    }

    if (orderData.tableId && orderData.table) {
      const areaId = orderData.table.areaId || orderData.table.area?.id;
      if (areaId) {
        setEditSelectedAreaId(areaId);
      }

      if (orderData.table.isTemporary) {
        setEditIsTemporaryTable(true);
        setEditTemporaryTableName(orderData.table.name || '');
      } else {
        setEditIsTemporaryTable(false);
        setEditTemporaryTableName('');
      }
    } else {
      setEditIsTemporaryTable(false);
      setEditTemporaryTableName('');
    }

    const groupedItemsMap = new Map<string, CartItem>();

    if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
      orderData.orderItems.forEach((item: any) => {
        const modifiers: CartItemModifier[] = [];

        if (item.modifiers && Array.isArray(item.modifiers)) {
          item.modifiers.forEach((mod: any) => {
            modifiers.push({
              id: mod.productModifierId,
              modifierGroupId: mod.productModifier?.modifierGroupId || '',
              name: mod.productModifier?.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            });
          });
        } else if (
          item.productModifiers &&
          Array.isArray(item.productModifiers)
        ) {
          item.productModifiers.forEach((mod: any) => {
            const modifierInfo = findModifierById(mod.id) || {
              id: mod.id,
              modifierGroupId: mod.modifierGroupId || '',
              name: mod.name || 'Modificador',
              price: parseFloat(mod.price) || 0,
            };
            modifiers.push(modifierInfo);
          });
        }

        const modifiersPrice = modifiers.reduce(
          (sum: number, mod: any) => sum + (parseFloat(mod.price) || 0),
          0,
        );
        const unitPrice = parseFloat(item.basePrice || '0');

        const modifierIds = modifiers
          .map((m) => m.id)
          .sort()
          .join(',');
        const pizzaCustomizationIds = item.selectedPizzaCustomizations
          ? item.selectedPizzaCustomizations
              .map(
                (c: any) => `${c.pizzaCustomizationId}-${c.half}-${c.action}`,
              )
              .sort()
              .join(',')
          : '';
        const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

        const existingItem = groupedItemsMap.get(groupKey);

        if (
          existingItem &&
          existingItem.preparationStatus === item.preparationStatus
        ) {
          existingItem.quantity += 1;
          existingItem.totalPrice =
            (unitPrice + modifiersPrice) * existingItem.quantity;
          existingItem.id = `${existingItem.id},${item.id}`;
        } else {
          const cartItem: CartItem = {
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || 'Producto desconocido',
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice + modifiersPrice,
            modifiers,
            variantId: item.productVariantId || undefined,
            variantName: item.productVariant?.name || undefined,
            preparationNotes: item.preparationNotes || undefined,
            preparationStatus: item.preparationStatus || 'PENDING',
            selectedPizzaCustomizations:
              item.selectedPizzaCustomizations || undefined,
          };
          groupedItemsMap.set(groupKey, cartItem);
        }
      });

      const mappedItems = Array.from(groupedItemsMap.values());
      setEditItems(mappedItems);
    }

    setOrderDataLoaded(true);

    const originalItems = Array.from(groupedItemsMap.values());
    const originalAdjustments =
      orderData.adjustments?.map((adj: any) => ({
        id: adj.id,
        name: adj.name,
        isPercentage: adj.isPercentage,
        value: adj.value,
        amount: adj.amount,
      })) || [];

    setOriginalOrderState({
      items: originalItems,
      orderType: orderData.orderType,
      tableId: orderData.tableId ?? null,
      isTemporaryTable: orderData.table?.isTemporary || false,
      temporaryTableName: orderData.table?.isTemporary
        ? orderData.table.name
        : '',
      deliveryInfo: orderData.deliveryInfo || {},
      notes: orderData.notes ?? '',
      scheduledAt: orderData.scheduledAt
        ? new Date(orderData.scheduledAt)
        : null,
      adjustments: originalAdjustments,
    });

    setHasUnsavedChanges(false);
  }, [
    isEditMode,
    orderData,
    visible,
    findModifierById,
    setEditOrderType,
    setEditSelectedTableId,
    setEditScheduledTime,
    setEditDeliveryInfo,
    setEditOrderNotes,
    setEditAdjustments,
    setEditSelectedAreaId,
    setEditIsTemporaryTable,
    setEditTemporaryTableName,
    setEditItems,
    setOrderDataLoaded,
    setOriginalOrderState,
    setHasUnsavedChanges,
  ]);

  return {
    findModifierById,
  };
};
