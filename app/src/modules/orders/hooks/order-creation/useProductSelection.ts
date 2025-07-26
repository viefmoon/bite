import { useState, useCallback, useRef } from 'react';
import { Product } from '../../types/orders.types';
import { CartItem, CartItemModifier } from '../../stores/useOrderStore';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';

interface UseProductSelectionProps {
  menu: any;
  showCart: () => void;
  hideCart: () => void;
  isCartEmpty: boolean;
  addItem: (
    product: Product,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
  updateItem: (
    itemId: string,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => void;
}

export const useProductSelection = ({
  menu,
  showCart,
  hideCart,
  isCartEmpty,
  addItem: originalAddItem,
  updateItem,
}: UseProductSelectionProps) => {
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [selectedProductForDescription, setSelectedProductForDescription] =
    useState<Product | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] =
    useState(false);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const cartButtonRef = useRef<{ animate: () => void }>(null);

  const productNeedsCustomization = useCallback((product: Product): boolean => {
    if (!product) return false;
    const hasVariants =
      product.hasVariants &&
      product.variants &&
      Array.isArray(product.variants) &&
      product.variants.length > 0;
    const hasModifiers =
      product.modifierGroups &&
      Array.isArray(product.modifierGroups) &&
      product.modifierGroups.length > 0;
    return hasVariants || hasModifiers;
  }, []);

  const handleAddItem = useCallback(
    (
      product: Product,
      quantity: number,
      selectedVariantId?: string,
      selectedModifiers?: CartItemModifier[],
      preparationNotes?: string,
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
    ) => {
      originalAddItem(
        product,
        quantity,
        selectedVariantId,
        selectedModifiers,
        preparationNotes,
        selectedPizzaCustomizations,
        pizzaExtraCost,
      );
      cartButtonRef.current?.animate();
    },
    [originalAddItem],
  );

  const handleProductSelect = useCallback(
    (
      product: Product,
      setSelectedProduct: (product: Product | null) => void,
    ) => {
      if (productNeedsCustomization(product)) {
        setSelectedProduct(product);
      } else {
        handleAddItem(product, 1);
      }
    },
    [productNeedsCustomization, handleAddItem],
  );

  const handleCloseProductModal = useCallback(
    (setSelectedProduct: (product: Product | null) => void) => {
      setSelectedProduct(null);
      setEditingItem(null);
      if (editingItem && !isCartEmpty) {
        showCart();
      }
    },
    [editingItem, isCartEmpty, showCart],
  );

  const handleEditItem = useCallback(
    (item: CartItem, setSelectedProduct: (product: Product | null) => void) => {
      if (!menu || !Array.isArray(menu)) {
        showSnackbar({
          message:
            'El menú aún se está cargando. Por favor, intenta nuevamente.',
          type: 'info',
        });
        return;
      }

      let product: Product | undefined;

      for (const category of menu) {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            if (subcategory.products && Array.isArray(subcategory.products)) {
              product = subcategory.products.find(
                (p: Product) => p.id === item.productId,
              );
              if (product) break;
            }
          }
        }
        if (product) break;
      }

      if (product) {
        setEditingItem(item);
        setSelectedProduct(product);
        hideCart();
      } else {
        showSnackbar({
          message:
            'No se pudo encontrar el producto. Por favor, recarga la pantalla.',
          type: 'error',
        });
      }
    },
    [menu, showSnackbar, hideCart],
  );

  const handleShowProductDescription = useCallback((product: Product) => {
    setSelectedProductForDescription(product);
    setIsDescriptionModalVisible(true);
  }, []);

  const handleCloseDescriptionModal = useCallback(() => {
    setIsDescriptionModalVisible(false);
    setSelectedProductForDescription(null);
  }, []);

  return {
    editingItem,
    selectedProductForDescription,
    isDescriptionModalVisible,
    cartButtonRef,
    productNeedsCustomization,
    handleAddItem,
    handleProductSelect,
    handleCloseProductModal,
    handleEditItem,
    handleShowProductDescription,
    handleCloseDescriptionModal,
    updateItem,
  };
};
