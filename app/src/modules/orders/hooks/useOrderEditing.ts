import { useState, useCallback } from 'react';
import { CartItem } from '../stores/useOrderCreationStore';
import { Product } from '../types/orders.types';

interface UseOrderEditingProps {
  isEditMode: boolean;
  onEditItem?: (item: CartItem) => void;
}

export const useOrderEditing = ({
  isEditMode,
  onEditItem,
}: UseOrderEditingProps) => {
  const [editingItemFromList, setEditingItemFromList] =
    useState<CartItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEditCartItem = useCallback(
    (item: CartItem) => {
      if (!isEditMode) {
        if (onEditItem) {
          onEditItem(item);
        }
        return;
      }

      // En modo edición, crear un producto temporal con la información del item
      setEditingItemFromList(item);

      const tempProduct: Product = {
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        description: '',
        isActive: true,
        hasVariants: !!item.variantId,
        variants: item.variantId
          ? [
              {
                id: item.variantId,
                name: item.variantName || '',
                price: item.unitPrice,
                isActive: true,
              },
            ]
          : [],
        modifierGroups: [],
        photo: null,
        categoryId: '',
        subCategoryId: '',
        restaurantId: '',
        preparationScreenId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPizza: false,
        pizzaConfiguration: null,
        pizzaCustomizations: [],
      };

      setEditingProduct(tempProduct);
    },
    [isEditMode, onEditItem],
  );

  const clearEditingState = useCallback(() => {
    setEditingItemFromList(null);
    setEditingProduct(null);
  }, []);

  return {
    editingItemFromList,
    editingProduct,
    handleEditCartItem,
    clearEditingState,
    setEditingItemFromList,
    setEditingProduct,
  };
};
