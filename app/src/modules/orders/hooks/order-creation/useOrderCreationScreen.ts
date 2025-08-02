import { useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useGetOrderMenu } from '../../hooks/useMenuQueries';
import { useGlobalShift } from '@/app/hooks/useGlobalShift';
import {
  useOrderManagement,
  useIsOrderEmpty,
  useOrderItemsCount,
} from '../../stores/useOrderManagement';
import { useAuthStore } from '@/app/stores/authStore';
import { Product, Category, SubCategory } from '../../schema/orders.schema';
import { canOpenShift } from '@/app/utils/roleUtils';
import { useOrderScreenNavigation } from '../useOrderScreenNavigation';
import { useOrderScreenStyles } from '../useOrderScreenStyles';
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

  // Estados globales
  const {
    addItem: originalAddItem,
    updateItem,
    isCartVisible,
    showCart,
    hideCart,
    setOrderType,
    setDeliveryInfo,
    setScheduledTime,
    resetOrder,
  } = useOrderManagement();

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
    setScheduledTime,
    cartButtonRef: productSelection.cartButtonRef,
  });

  const orderCreation = useOrderCreation({
    hideCart,
    resetOrder,
    isCartEmpty,
  });

  // Hooks especializados para navegación y estilos
  const screenNavigation = useOrderScreenNavigation({
    menu,
    navigationLevel,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedProduct,
  });

  const { styles } = useOrderScreenStyles();

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
      orderCreation,
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
  const shouldShowShiftClosed =
    !shiftLoading && (!shift || shift.status !== 'OPEN');
  const showCartButton = !isCartVisible && !selectedProduct;

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
    itemsToDisplay: screenNavigation.itemsToDisplay,
    navTitle: screenNavigation.navTitle,
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
    selectedProductForDescription:
      productSelection.selectedProductForDescription,
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
