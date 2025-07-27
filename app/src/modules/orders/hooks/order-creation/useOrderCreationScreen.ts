import { useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useGetOrderMenu } from '../../hooks/useMenuQueries';
import { useGlobalShift } from '@/app/hooks/useGlobalShift';
import {
  useOrderStore,
  useIsOrderEmpty,
  useOrderItemsCount,
} from '../../stores/useOrderStore';
import { useAuthStore } from '@/app/store/authStore';
import { Product, Category, SubCategory } from '../../schema/orders.schema';
import { canOpenShift } from '@/app/utils/roleUtils';
import { useAppTheme } from '@/app/styles/theme';
import {
  useOrderNavigation,
  useProductSelection,
  useAudioOrder,
  useOrderCreation,
} from './index';

/**
 * Hook unificado que orquesta toda la lógica de la pantalla CreateOrderScreen.
 * Consolida los múltiples hooks especializados y proporciona una API limpia
 * para el componente de UI.
 */
export const useOrderCreationScreen = () => {
  const navigation = useNavigation();
  const theme = useAppTheme();

  // Estados globales
  const {
    addItem: originalAddItem,
    updateItem,
    isCartVisible,
    showCart,
    hideCart,
    setOrderType,
    setDeliveryInfo,
    resetOrder,
  } = useOrderStore();

  const isCartEmpty = useIsOrderEmpty();
  const totalItemsCount = useOrderItemsCount();
  const user = useAuthStore((state) => state.user);
  const { data: shift, isLoading: shiftLoading } = useGlobalShift();
  const userCanOpenShift = canOpenShift(user);
  const { data: menu, isLoading } = useGetOrderMenu();

  // Hooks especializados
  const orderNavigation = useOrderNavigation();
  const {
    navigationLevel,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedProduct,
    setSelectedProduct,
    handleCategorySelect,
    handleSubCategorySelect,
    handleGoBackInternal,
  } = orderNavigation;

  const productSelection = useProductSelection({
    menu,
    showCart,
    hideCart,
    isCartEmpty,
    addItem: originalAddItem,
    updateItem,
  });

  const audioOrder = useAudioOrder({
    menu,
    handleAddItem: productSelection.handleAddItem,
    setDeliveryInfo,
    setOrderType,
    cartButtonRef: productSelection.cartButtonRef,
  });

  const orderCreation = useOrderCreation({
    hideCart,
    resetOrder,
    isCartEmpty,
  });

  // Estados derivados para la UI
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

  const itemsToDisplay = useMemo(() => {
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

  const navTitle = useMemo(() => {
    if (selectedProduct) {
      return selectedProduct.name;
    }
    switch (navigationLevel) {
      case 'categories':
        return 'Categorías';
      case 'subcategories':
        return selectedCategory?.name
          ? `Categoría: ${selectedCategory.name}`
          : 'Subcategorías';
      case 'products':
        return selectedSubCategory?.name
          ? `Subcategoría: ${selectedSubCategory.name}`
          : 'Productos';
      default:
        return 'Categorías';
    }
  }, [navigationLevel, selectedCategory, selectedSubCategory, selectedProduct]);

  // Handlers unificados
  const handleProductSelect = useCallback(
    (product: Product) => {
      productSelection.handleProductSelect(product, setSelectedProduct);
    },
    [productSelection, setSelectedProduct],
  );

  const handleCloseProductModal = useCallback(() => {
    productSelection.handleCloseProductModal(setSelectedProduct);
  }, [productSelection, setSelectedProduct]);

  const handleEditItem = useCallback(
    (item: any) => {
      productSelection.handleEditItem(item, setSelectedProduct);
    },
    [productSelection, setSelectedProduct],
  );

  const handleBack = useMemo(
    () =>
      selectedProduct
        ? handleCloseProductModal
        : navigationLevel === 'categories'
          ? () => orderCreation.handleAttemptExit(() => navigation.goBack())
          : handleGoBackInternal,
    [
      selectedProduct,
      navigationLevel,
      handleCloseProductModal,
      orderCreation.handleAttemptExit,
      handleGoBackInternal,
      navigation,
    ],
  );

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

  const handleViewCart = useCallback(() => {
    showCart();
  }, [showCart]);

  const handleCloseCart = useCallback(() => {
    hideCart();
  }, [hideCart]);

  // Condiciones para renderizado
  const shouldShowShiftClosed = !shiftLoading && (!shift || shift.status !== 'OPEN');
  const showCartButton = !isCartVisible && !selectedProduct;

  // Estilos (movidos desde el componente)
  const styles = useMemo(
    () => ({
      safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
      },
      appBar: {
        backgroundColor: theme.colors.elevation.level2,
        alignItems: 'center' as const,
      },
      appBarTitle: {
        ...theme.fonts.titleMedium,
        color: theme.colors.onSurface,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
      },
      appBarContent: {},
      spacer: {
        width: 48,
      },
    }),
    [theme],
  );

  // API expuesta al componente
  return {
    // Estados de carga y datos
    isLoading,
    shiftLoading,
    shouldShowShiftClosed,
    userCanOpenShift,
    
    // Estados de navegación y UI
    isCartVisible,
    selectedProduct,
    navigationLevel,
    itemsToDisplay,
    navTitle,
    showCartButton,
    totalItemsCount,
    
    // Handlers principales
    handleItemSelect,
    handleBack,
    handleViewCart,
    handleCloseCart,
    handleEditItem,
    handleCloseProductModal,
    
    // Estados y handlers de modales
    showExitConfirmationModal: orderCreation.showExitConfirmationModal,
    handleConfirmOrder: orderCreation.handleConfirmOrder,
    handleConfirmExit: orderCreation.handleConfirmExit,
    handleCancelExit: orderCreation.handleCancelExit,
    
    // Estados del modal de producto
    editingItem: productSelection.editingItem,
    productNeedsCustomization: productSelection.productNeedsCustomization,
    updateItem,
    handleAddItem: productSelection.handleAddItem,
    
    // Estados del modal de descripción
    selectedProductForDescription: productSelection.selectedProductForDescription,
    isDescriptionModalVisible: productSelection.isDescriptionModalVisible,
    handleShowProductDescription: productSelection.handleShowProductDescription,
    handleCloseDescriptionModal: productSelection.handleCloseDescriptionModal,
    
    // Estados de audio
    showAudioModal: audioOrder.showAudioModal,
    audioOrderData: audioOrder.audioOrderData,
    isProcessingAudio: audioOrder.isProcessingAudio,
    audioError: audioOrder.audioError,
    handleAudioRecordingComplete: audioOrder.handleAudioRecordingComplete,
    handleAudioError: audioOrder.handleAudioError,
    handleConfirmAudioOrder: audioOrder.handleConfirmAudioOrder,
    setShowAudioModal: audioOrder.setShowAudioModal,
    setAudioOrderData: audioOrder.setAudioOrderData,
    setAudioError: audioOrder.setAudioError,
    
    // Referencias y datos adicionales
    cartButtonRef: productSelection.cartButtonRef,
    menu,
    selectedCategoryId,
    handleCategorySelect,
    
    // Estilos
    styles,
  };
};