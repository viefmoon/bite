import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useGetOrderMenu } from '../hooks/useMenuQueries';
import { Product, Category, SubCategory } from '../types/orders.types';

import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import CartButton from '../components/CartButton';
import { AudioRecorderWidget } from '@/components/AudioRecorderWidget';
import { AudioOrderModal } from '@/components/AudioOrderModal';

import { CategoryGrid } from '../components/order-creation';
import { useOrderNavigation, useAudioOrder } from '../hooks/order-creation';

import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useAppTheme } from '@/app/styles/theme';
import type { OrdersStackScreenProps } from '@/app/navigation/types';
import {
  CartItem,
  CartItemModifier,
  useOrderStore,
} from '../stores/useOrderStore';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';

type AddProductsRouteProps = {
  orderId: string;
  orderNumber: number;
  onProductsAdded?: () => void;
};

const AddProductsToOrderScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route =
    useRoute<OrdersStackScreenProps<'AddProductsToOrder'>['route']>();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const cartButtonRef = useRef<{ animate: () => void }>(null);

  const { orderId, orderNumber, onProductsAdded } =
    route.params as AddProductsRouteProps;

  // Conectar directamente al store
  const { items: storeItems, addItem: addItemToStore } = useOrderStore();

  // Estado local para productos siendo añadidos en esta sesión
  const [selectedProducts, setSelectedProducts] = useState<CartItem[]>([]);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [selectedProductForDescription, setSelectedProductForDescription] =
    useState<Product | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] =
    useState(false);

  const {
    navigationLevel,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedProduct,
    setSelectedProduct,
    handleCategorySelect,
    handleSubCategorySelect,
    handleGoBackInternal,
  } = useOrderNavigation();

  const { data: menu, isLoading } = useGetOrderMenu();

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

  const addItemToSelection = useCallback(
    (
      product: Product,
      quantity: number,
      selectedVariantId?: string,
      selectedModifiers?: CartItemModifier[],
      preparationNotes?: string,
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
    ) => {
      const selectedVariant = product.variants?.find(
        (v) => v.id === selectedVariantId,
      );
      const variantPrice = selectedVariant?.price || product.price;
      const modifiersPrice =
        selectedModifiers?.reduce((sum, mod) => sum + (mod.price || 0), 0) || 0;
      const pizzaCost = pizzaExtraCost || 0;
      const unitPrice = variantPrice + modifiersPrice + pizzaCost;

      const existingIndex = selectedProducts.findIndex((item) => {
        if (item.productId !== product.id) return false;
        if (item.variantId !== selectedVariantId) return false;
        if (item.preparationNotes !== preparationNotes) return false;

        const itemModifierIds = item.modifiers
          .map((m) => m.id)
          .sort()
          .join(',');
        const newModifierIds = (selectedModifiers || [])
          .map((m) => m.id)
          .sort()
          .join(',');

        if (itemModifierIds !== newModifierIds) return false;

        const existingCustomizations = item.selectedPizzaCustomizations || [];
        const newCustomizations = selectedPizzaCustomizations || [];

        if (existingCustomizations.length !== newCustomizations.length)
          return false;

        const sortedExistingCustomizations = [...existingCustomizations].sort(
          (a, b) =>
            `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
              `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
            ),
        );
        const sortedNewCustomizations = [...newCustomizations].sort((a, b) =>
          `${a.pizzaCustomizationId}-${a.half}-${a.action}`.localeCompare(
            `${b.pizzaCustomizationId}-${b.half}-${b.action}`,
          ),
        );

        for (let i = 0; i < sortedExistingCustomizations.length; i++) {
          if (
            sortedExistingCustomizations[i].pizzaCustomizationId !==
              sortedNewCustomizations[i].pizzaCustomizationId ||
            sortedExistingCustomizations[i].half !==
              sortedNewCustomizations[i].half ||
            sortedExistingCustomizations[i].action !==
              sortedNewCustomizations[i].action
          ) {
            return false;
          }
        }

        return true;
      });

      if (existingIndex !== -1) {
        setSelectedProducts((prev) => {
          const updated = [...prev];
          const existingItem = updated[existingIndex];
          const newQuantity = existingItem.quantity + quantity;

          const modifiersTotal = existingItem.modifiers.reduce(
            (sum, mod) => sum + Number(mod.price || 0),
            0,
          );
          const pizzaCostTotal = existingItem.pizzaExtraCost || 0;
          const unitPriceWithModifiers =
            Number(existingItem.unitPrice || 0) +
            modifiersTotal +
            pizzaCostTotal;

          updated[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: unitPriceWithModifiers * newQuantity,
          };
          return updated;
        });
      } else {
        const newItem: CartItem = {
          id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: variantPrice,
          totalPrice: unitPrice * quantity,
          modifiers: selectedModifiers || [],
          variantId: selectedVariantId,
          variantName: selectedVariant?.name,
          preparationNotes,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        };

        setSelectedProducts((prev) => [...prev, newItem]);
      }

      cartButtonRef.current?.animate();

      showSnackbar({
        message: `${product.name} añadido`,
        type: 'success',
      });
    },
    [selectedProducts, showSnackbar],
  );

  const {
    showAudioModal,
    audioOrderData,
    isProcessingAudio,
    audioError,
    handleAudioRecordingComplete,
    handleAudioError,
    handleConfirmAudioOrder: handleConfirmAudioOrderBase,
    setShowAudioModal,
    setAudioOrderData,
    setAudioError,
  } = useAudioOrder({
    menu,
    handleAddItem: addItemToSelection,
    cartButtonRef,
  });

  const handleConfirmAudioOrder = useCallback(
    async (
      items: any[],
      deliveryInfo?: any,
      scheduledDelivery?: any,
      orderType?: any,
    ) => {
      await handleConfirmAudioOrderBase(items);
    },
    [handleConfirmAudioOrderBase],
  );

  const totalItemsCount = useMemo(() => {
    const storeItemsCount = storeItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const newItemsCount = selectedProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    return storeItemsCount + newItemsCount;
  }, [storeItems, selectedProducts]);

  const handleProductSelect = useCallback(
    (product: Product) => {
      if (productNeedsCustomization(product)) {
        setSelectedProduct(product);
      } else {
        addItemToSelection(product, 1);
      }
    },
    [productNeedsCustomization, addItemToSelection, setSelectedProduct],
  );

  const handleCloseProductModal = useCallback(() => {
    setSelectedProduct(null);
    setEditingItem(null);
  }, [setSelectedProduct]);

  const handleConfirmSelection = () => {
    // Agregar todos los productos seleccionados al store
    selectedProducts.forEach((item) => {
      const product = {
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
      };
      addItemToStore(
        product as any,
        item.quantity,
        item.variantId,
        item.modifiers,
        item.preparationNotes,
        item.selectedPizzaCustomizations,
        item.pizzaExtraCost,
      );
    });

    // Notificar que se completó
    if (onProductsAdded) {
      onProductsAdded();
    }
    navigation.goBack();
  };

  const handleBack = () => {
    if (selectedProduct) {
      setSelectedProduct(null);
    } else if (navigationLevel === 'products') {
      handleGoBackInternal();
    } else if (navigationLevel === 'subcategories') {
      handleGoBackInternal();
    } else {
      // Si hay productos seleccionados, preguntar antes de salir
      if (selectedProducts.length > 0) {
        // Por ahora, simplemente salir sin guardar
        navigation.goBack();
      } else {
        navigation.goBack();
      }
    }
  };

  const selectedCategory = useMemo(
    () =>
      menu && Array.isArray(menu)
        ? menu.find((cat: Category) => cat.id === selectedCategoryId)
        : null,
    [menu, selectedCategoryId],
  );

  const selectedSubCategory = useMemo(
    () =>
      selectedCategory && Array.isArray(selectedCategory.subcategories)
        ? selectedCategory.subcategories.find(
            (sub: SubCategory) => sub.id === selectedSubcategoryId,
          )
        : null,
    [selectedCategory, selectedSubcategoryId],
  );

  const getItemsToDisplay = useCallback(() => {
    switch (navigationLevel) {
      case 'categories':
        return menu && Array.isArray(menu) ? menu : [];
      case 'subcategories':
        return selectedCategory?.subcategories || [];
      case 'products':
        return selectedSubCategory?.products || [];
      default:
        return [];
    }
  }, [navigationLevel, menu, selectedCategory, selectedSubCategory]);

  const getNavTitle = useCallback(() => {
    if (selectedProduct) {
      return selectedProduct.name;
    }
    switch (navigationLevel) {
      case 'categories':
        return `Añadir a Orden #${orderNumber}`;
      case 'subcategories':
        return selectedCategory?.name || 'Subcategorías';
      case 'products':
        return selectedSubCategory?.name || 'Productos';
      default:
        return 'Categorías';
    }
  }, [
    navigationLevel,
    selectedCategory,
    selectedSubCategory,
    selectedProduct,
    orderNumber,
  ]);

  const handleItemSelect = useCallback(
    (item: Category | SubCategory | Product) => {
      if (navigationLevel === 'categories') {
        handleCategorySelect(item.id);
      } else if (navigationLevel === 'subcategories') {
        handleSubCategorySelect(item.id);
      } else if ('price' in item) {
        handleProductSelect(item as Product);
      }
    },
    [
      navigationLevel,
      handleCategorySelect,
      handleSubCategorySelect,
      handleProductSelect,
    ],
  );

  const handleShowProductDescription = useCallback((product: Product) => {
    setSelectedProductForDescription(product);
    setIsDescriptionModalVisible(true);
  }, []);

  const handleCloseDescriptionModal = useCallback(() => {
    setIsDescriptionModalVisible(false);
    setSelectedProductForDescription(null);
  }, []);

  const updateItemInSelection = useCallback(
    (
      itemId: string,
      quantity: number,
      modifiers: CartItemModifier[],
      preparationNotes?: string,
      variantId?: string,
      variantName?: string,
      unitPrice?: number,
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
    ) => {
      setSelectedProducts((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const modifiersPrice = modifiers.reduce(
              (sum, mod) => sum + Number(mod.price || 0),
              0,
            );
            const pizzaCost = pizzaExtraCost || 0;
            const finalUnitPrice =
              unitPrice !== undefined ? unitPrice : item.unitPrice;
            const newTotalPrice =
              (finalUnitPrice + modifiersPrice + pizzaCost) * quantity;

            return {
              ...item,
              quantity,
              modifiers,
              preparationNotes:
                preparationNotes !== undefined
                  ? preparationNotes
                  : item.preparationNotes,
              variantId: variantId !== undefined ? variantId : item.variantId,
              variantName:
                variantName !== undefined ? variantName : item.variantName,
              unitPrice: finalUnitPrice,
              totalPrice: newTotalPrice,
              selectedPizzaCustomizations:
                selectedPizzaCustomizations !== undefined
                  ? selectedPizzaCustomizations
                  : item.selectedPizzaCustomizations,
              pizzaExtraCost,
            };
          }
          return item;
        }),
      );
    },
    [],
  );

  const handleAddToCart = useCallback(
    (
      product: Product,
      quantity: number,
      selectedVariantId?: string,
      selectedModifiers?: CartItemModifier[],
      preparationNotes?: string,
      selectedPizzaCustomizations?: SelectedPizzaCustomization[],
      pizzaExtraCost?: number,
    ) => {
      if (editingItem) {
        updateItemInSelection(
          editingItem.id,
          quantity,
          selectedModifiers || [],
          preparationNotes,
          selectedVariantId,
          product.variants?.find((v) => v.id === selectedVariantId)?.name,
          selectedVariantId
            ? product.variants?.find((v) => v.id === selectedVariantId)?.price
            : product.price,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        );
        setEditingItem(null);
      } else {
        addItemToSelection(
          product,
          quantity,
          selectedVariantId,
          selectedModifiers,
          preparationNotes,
          selectedPizzaCustomizations,
          pizzaExtraCost,
        );
      }
      setSelectedProduct(null);
    },
    [
      editingItem,
      addItemToSelection,
      updateItemInSelection,
      setSelectedProduct,
    ],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        appBar: {
          backgroundColor: theme.colors.elevation.level2,
          alignItems: 'center',
        },
        appBarTitle: {
          ...theme.fonts.titleMedium,
          color: theme.colors.onSurface,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        appBarContent: {},
      }),
    [theme],
  );

  const itemsToDisplay = getItemsToDisplay();
  const showCartButton = !selectedProduct;

  return (
    <>
      <CategoryGrid
        isLoading={isLoading}
        navigationLevel={navigationLevel}
        items={itemsToDisplay}
        title={getNavTitle()}
        onItemSelect={handleItemSelect}
        onBack={handleBack}
        onProductInfo={handleShowProductDescription}
        showCartButton={showCartButton}
        cartButtonRef={cartButtonRef}
        totalItemsCount={totalItemsCount}
        onViewCart={handleConfirmSelection}
        cartItems={selectedProducts}
        categories={menu}
        selectedCategoryId={selectedCategoryId}
        onCategoryQuickSelect={handleCategorySelect}
      />

      <Portal>
        {selectedProduct && (
          <ProductCustomizationModal
            visible={true}
            product={selectedProduct}
            editingItem={editingItem}
            onDismiss={handleCloseProductModal}
            onAddToCart={handleAddToCart}
            onUpdateItem={(
              itemId,
              quantity,
              modifiers,
              notes,
              variantId,
              variantName,
              unitPrice,
              selectedPizzaCustomizations,
              pizzaExtraCost,
            ) => {
              updateItemInSelection(
                itemId,
                quantity,
                modifiers,
                notes,
                variantId,
                variantName,
                unitPrice,
                selectedPizzaCustomizations,
                pizzaExtraCost,
              );
              setEditingItem(null);
              setSelectedProduct(null);
            }}
          />
        )}

        {selectedProductForDescription && (
          <SimpleProductDescriptionModal
            visible={isDescriptionModalVisible}
            product={selectedProductForDescription}
            onDismiss={handleCloseDescriptionModal}
          />
        )}

        <AudioOrderModal
          visible={showAudioModal}
          onDismiss={() => {
            setShowAudioModal(false);
            setAudioOrderData(null);
            setAudioError(undefined);
          }}
          onConfirm={handleConfirmAudioOrder}
          isProcessing={isProcessingAudio}
          orderData={audioOrderData}
          error={audioError}
        />
      </Portal>

      {!selectedProduct && (
        <AudioRecorderWidget
          onRecordingComplete={handleAudioRecordingComplete}
          onError={handleAudioError}
        />
      )}
    </>
  );
};

export default AddProductsToOrderScreen;
