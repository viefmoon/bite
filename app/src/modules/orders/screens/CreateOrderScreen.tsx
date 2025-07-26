import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useGetOrderMenu } from '../hooks/useMenuQueries';
import { useGlobalShift } from '@/app/hooks/useGlobalShift';
import {
  useOrderStore,
  useIsOrderEmpty,
  useOrderItemsCount,
} from '../stores/useOrderStore';
import { useAuthStore } from '@/app/store/authStore';

import { Product, Category, SubCategory } from '../schema/orders.schema';
import OrderCartDetail from '../components/OrderCartDetail';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { AudioRecorderWidget } from '@/components/AudioRecorderWidget';
import { AudioOrderModal } from '@/components/AudioOrderModal';

import { ShiftClosedView, CategoryGrid } from '../components/order-creation';
import {
  useOrderNavigation,
  useProductSelection,
  useAudioOrder,
  useOrderCreation,
} from '../hooks/order-creation';

import { canOpenShift } from '@/app/utils/roleUtils';
import { useAppTheme } from '@/app/styles/theme';

const CreateOrderScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();

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

  const {
    editingItem,
    selectedProductForDescription,
    isDescriptionModalVisible,
    cartButtonRef,
    productNeedsCustomization,
    handleAddItem,
    handleProductSelect: handleProductSelectBase,
    handleCloseProductModal: handleCloseProductModalBase,
    handleEditItem: handleEditItemBase,
    handleShowProductDescription,
    handleCloseDescriptionModal,
  } = useProductSelection({
    menu,
    showCart,
    hideCart,
    isCartEmpty,
    addItem: originalAddItem,
    updateItem,
  });

  const {
    showAudioModal,
    audioOrderData,
    isProcessingAudio,
    audioError,
    handleAudioRecordingComplete,
    handleAudioError,
    handleConfirmAudioOrder,
    setShowAudioModal,
    setAudioOrderData,
    setAudioError,
  } = useAudioOrder({
    menu,
    handleAddItem,
    setDeliveryInfo,
    setOrderType,
    cartButtonRef,
  });

  const {
    showExitConfirmationModal,
    handleConfirmOrder,
    handleAttemptExit,
    handleConfirmExit,
    handleCancelExit,
  } = useOrderCreation({
    hideCart,
    resetOrder,
    isCartEmpty,
  });

  const handleProductSelect = useCallback(
    (product: Product) => {
      handleProductSelectBase(product, setSelectedProduct);
    },
    [handleProductSelectBase, setSelectedProduct],
  );

  const handleCloseProductModal = useCallback(() => {
    handleCloseProductModalBase(setSelectedProduct);
  }, [handleCloseProductModalBase, setSelectedProduct]);

  const handleEditItem = useCallback(
    (item: any) => {
      handleEditItemBase(item, setSelectedProduct);
    },
    [handleEditItemBase, setSelectedProduct],
  );

  const handleViewCart = useCallback(() => {
    showCart();
  }, [showCart]);

  const handleCloseCart = useCallback(() => {
    hideCart();
  }, [hideCart]);

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

  const backAction = useMemo(
    () =>
      selectedProduct
        ? handleCloseProductModal
        : navigationLevel === 'categories'
          ? () => handleAttemptExit(() => navigation.goBack())
          : handleGoBackInternal,
    [
      selectedProduct,
      navigationLevel,
      handleCloseProductModal,
      handleAttemptExit,
      handleGoBackInternal,
      navigation,
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
        spacer: {
          width: 48,
        },
      }),
    [theme],
  );

  if (isCartVisible) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleCloseCart} />
          <Appbar.Content
            title="Carrito de Compras"
            titleStyle={styles.appBarTitle}
            style={styles.appBarContent}
          />
          <View style={styles.spacer} />
        </Appbar.Header>
        <OrderCartDetail
          visible={isCartVisible}
          onClose={handleCloseCart}
          onConfirmOrder={handleConfirmOrder}
          onEditItem={handleEditItem}
          isEditMode={false}
        />
      </SafeAreaView>
    );
  }

  if (!shiftLoading && (!shift || shift.status !== 'OPEN')) {
    return (
      <ShiftClosedView
        onBack={() => navigation.goBack()}
        userCanOpenShift={userCanOpenShift}
      />
    );
  }

  const itemsToDisplay = getItemsToDisplay();
  const showCartButton = !isCartVisible && !selectedProduct;

  return (
    <>
      <CategoryGrid
        isLoading={isLoading}
        navigationLevel={navigationLevel}
        items={itemsToDisplay}
        title={getNavTitle()}
        onItemSelect={handleItemSelect}
        onBack={backAction}
        onProductInfo={handleShowProductDescription}
        showCartButton={showCartButton}
        cartButtonRef={cartButtonRef}
        totalItemsCount={totalItemsCount}
        onViewCart={handleViewCart}
        categories={menu}
        selectedCategoryId={selectedCategoryId}
        onCategoryQuickSelect={handleCategorySelect}
      />

      <ConfirmationModal
        visible={showExitConfirmationModal}
        title="¿Descartar Orden?"
        message="Tienes artículos en el carrito. Si sales, se perderán. ¿Estás seguro?"
        confirmText="Salir y Descartar"
        cancelText="Cancelar"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />

      <Portal>
        {selectedProduct && productNeedsCustomization(selectedProduct) && (
          <ProductCustomizationModal
            visible={true}
            product={selectedProduct}
            editingItem={editingItem}
            onAddToCart={handleAddItem}
            onUpdateItem={updateItem}
            onDismiss={handleCloseProductModal}
          />
        )}

        <SimpleProductDescriptionModal
          visible={isDescriptionModalVisible}
          product={selectedProductForDescription}
          onDismiss={handleCloseDescriptionModal}
        />

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

      {!isCartVisible && !selectedProduct && (
        <AudioRecorderWidget
          onRecordingComplete={handleAudioRecordingComplete}
          onError={handleAudioError}
        />
      )}
    </>
  );
};

export default CreateOrderScreen;
