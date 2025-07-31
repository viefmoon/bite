import { View } from 'react-native';
import { Portal, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrderCartDetail from '../components/OrderCartDetail';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { AudioRecorderWidget } from '@/app/components/audio/AudioRecorderWidget';
import { AudioOrderModal } from '@/app/components/audio/AudioOrderModal';

import { ShiftClosedView, CategoryGrid } from '../components/order-creation';
import { useOrderCreationScreen } from '../hooks/order-creation';

const CreateOrderScreen = () => {
  const {
    // Estados de carga y datos
    isLoading,
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
    showExitConfirmationModal,
    handleConfirmOrder,
    handleConfirmExit,
    handleCancelExit,

    // Estados del modal de producto
    editingItem,
    productNeedsCustomization,
    updateItem,
    handleAddItem,

    // Estados del modal de descripción
    selectedProductForDescription,
    isDescriptionModalVisible,
    handleShowProductDescription,
    handleCloseDescriptionModal,

    // Estados de audio
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

    // Referencias y datos adicionales
    cartButtonRef,
    menu,
    selectedCategoryId,
    handleCategorySelect,

    // Estilos
    styles,
  } = useOrderCreationScreen();

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

  if (shouldShowShiftClosed) {
    return (
      <ShiftClosedView
        onBack={handleBack}
        userCanOpenShift={userCanOpenShift}
      />
    );
  }

  return (
    <>
      <CategoryGrid
        isLoading={isLoading}
        navigationLevel={navigationLevel}
        items={itemsToDisplay}
        title={navTitle}
        onItemSelect={handleItemSelect}
        onBack={handleBack}
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
            onAddItem={handleAddItem}
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
