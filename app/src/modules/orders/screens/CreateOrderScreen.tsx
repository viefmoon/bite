import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import {
  Text,
  Portal,
  ActivityIndicator,
  Card,
  Title,
  Appbar,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGetFullMenu } from '../hooks/useMenuQueries';
// Importar el hook de mutación para crear órdenes
import { useCreateOrderMutation } from '@/modules/orders/hooks/useOrdersQueries'; // Usar ruta absoluta
import { useCart, CartProvider, CartItem } from '../context/CartContext';
import { CartItemModifier } from '../context/CartContext';
import {
  OrderType,
  Product,
  Category,
  SubCategory,
  Order, // Importar el tipo Order
} from '../types/orders.types';
import { Image } from 'expo-image';
import { getImageUrl } from '@/app/lib/imageUtils';

import OrderCartDetail from '../components/OrderCartDetail';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import CartButton from '../components/CartButton';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useSnackbarStore } from '@/app/store/snackbarStore'; // Importar snackbar
import { getApiErrorMessage } from '@/app/lib/errorMapping'; // Importar mapeo de errores

import { useAppTheme } from '@/app/styles/theme';
// Importar el tipo completo para el payload de confirmación
import type { OrderDetailsForBackend } from '../components/OrderCartDetail';

interface CartButtonHandle {
  animate: () => void;
}

const CreateOrderScreen = () => {
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const navigation = useNavigation();
  const {
    items,
    isCartEmpty,
    addItem: originalAddItem,
    updateItem,
    isCartVisible,
    showCart,
    hideCart,
    clearCart,
    totalItemsCount,
    setOrderType,
    setSelectedTableId,
    setCustomerName,
    setPhoneNumber,
    setDeliveryAddress,
    setOrderNotes,
    setItems,
    setScheduledTime,
  } = useCart();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar); // Hook para snackbar

  // Instanciar la mutación para crear la orden
  const createOrderMutation = useCreateOrderMutation();

  const cartButtonRef = useRef<CartButtonHandle>(null);

  const [navigationLevel, setNavigationLevel] = useState<
    'categories' | 'subcategories' | 'products'
  >('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showExitConfirmationModal, setShowExitConfirmationModal] =
    useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<
    (() => void) | null
  >(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [selectedProductForDescription, setSelectedProductForDescription] =
    useState<Product | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] =
    useState(false);

  const { data: menu, isLoading } = useGetFullMenu();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
    setNavigationLevel('subcategories');
  };

  const handleSubCategorySelect = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setNavigationLevel('products');
  };

  const productNeedsCustomization = (product: Product): boolean => {
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
  };

  const handleProductSelect = (product: Product) => {
    if (productNeedsCustomization(product)) {
      setSelectedProduct(product);
    } else {
      handleAddItem(product, 1);
    }
  };

  const handleCloseProductModal = useCallback(() => {
    setSelectedProduct(null);
    setEditingItem(null);
    // Si estábamos editando y hay items en el carrito, volver a mostrar el carrito
    if (editingItem && !isCartEmpty) {
      showCart();
    }
  }, [editingItem, isCartEmpty, showCart]);

  const handleEditItem = useCallback(
    (item: CartItem) => {
      // Encontrar el producto completo desde el menú
      if (!menu || !Array.isArray(menu)) {
        showSnackbar({
          message:
            'El menú aún se está cargando. Por favor, intenta nuevamente.',
          type: 'info',
        });
        return;
      }

      // Buscar el producto en la estructura anidada
      let product: Product | undefined;

      for (const category of menu) {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            if (subcategory.products && Array.isArray(subcategory.products)) {
              product = subcategory.products.find(
                (p) => p.id === item.productId,
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
        hideCart(); // Cerrar el carrito para mostrar el modal de personalización
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

  const handleGoBackInternal = () => {
    if (navigationLevel === 'products') {
      setNavigationLevel('subcategories');
      setSelectedSubcategoryId(null);
    } else if (navigationLevel === 'subcategories') {
      setNavigationLevel('categories');
      setSelectedCategoryId(null);
    }
  };

  const handleAttemptExit = (goBackAction: () => void) => {
    if (isCartEmpty) {
      goBackAction();
    } else {
      setPendingNavigationAction(() => goBackAction);
      setShowExitConfirmationModal(true);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Don't do anything if cart is empty or modal is already showing
      if (isCartEmpty || showExitConfirmationModal) {
        return;
      }

      // Prevent default for any navigation away when cart has items
      // This includes back navigation and drawer navigation
      e.preventDefault();
      setPendingNavigationAction(
        () => () => navigation.dispatch(e.data.action),
      );
      setShowExitConfirmationModal(true);
    });

    return unsubscribe;
  }, [navigation, isCartEmpty, showExitConfirmationModal]);

  const handleViewCart = useCallback(() => {
    showCart();
  }, [showCart]);

  const handleCloseCart = useCallback(() => {
    hideCart();
  }, [hideCart]);

  // Actualizar handleConfirmOrder para usar la mutación
  const handleConfirmOrder = async (details: OrderDetailsForBackend) => {
    if (isProcessingOrder) return; // Prevenir múltiples envíos

    console.log('Intentando confirmar orden con detalles:', details);
    setIsProcessingOrder(true);

    try {
      // Llamar a la mutación para enviar la orden al backend
      const createdOrder = await createOrderMutation.mutateAsync(details);

      // Usar 'dailyNumber' que es lo que devuelve el backend
      showSnackbar({
        message: `Orden #${createdOrder.dailyNumber} creada con éxito`,
        type: 'success',
      });
      hideCart();
      clearCart(); // Limpiar carrito después de éxito
      // Opcional: Navegar a otra pantalla, por ejemplo, la lista de órdenes
      // navigation.navigate('Orders'); // Asegúrate de que 'Orders' exista en tu stack
      navigation.goBack(); // O simplemente volver atrás
    } catch (error) {
      // El manejo de errores con snackbar ya debería estar en el hook useCreateOrderMutation
      const message = getApiErrorMessage(error as Error);
      showSnackbar({
        message: `Error al crear orden: ${message}`,
        type: 'error',
      });
      console.error('Error al crear la orden:', error);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleAddItem = (
    product: Product,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string,
  ) => {
    originalAddItem(
      product,
      quantity,
      selectedVariantId,
      selectedModifiers,
      preparationNotes,
    );
    cartButtonRef.current?.animate();
  };

  const getCategories = () => {
    if (!menu || !Array.isArray(menu)) return [];
    return menu;
  };

  const getSubcategories = () => {
    if (!selectedCategory || !Array.isArray(selectedCategory.subcategories))
      return [];
    return selectedCategory.subcategories;
  };

  const getProducts = () => {
    if (!selectedSubCategory || !Array.isArray(selectedSubCategory.products))
      return [];
    return selectedSubCategory.products;
  };

  const selectedCategory =
    menu && Array.isArray(menu)
      ? menu.find((cat: Category) => cat.id === selectedCategoryId)
      : null;

  const selectedSubCategory =
    selectedCategory && Array.isArray(selectedCategory.subcategories) // Corregido a lowercase
      ? selectedCategory.subcategories.find(
          // Corregido a lowercase
          (sub: SubCategory) => sub.id === selectedSubcategoryId,
        )
      : null;

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        container: {
          flex: 1,
        },
        content: {
          flex: 1,
        },
        gridContainer: {
          padding: 12,
          paddingBottom: 60,
        },
        row: {
          justifyContent: 'flex-start',
        },
        cardItem: {
          width: '48%',
          marginHorizontal: '1%',
          marginVertical: 4,
          overflow: 'hidden',
          borderRadius: 8,
          elevation: 2,
        },
        cardItemInactive: {
          opacity: 0.5,
        },
        itemImage: {
          width: '100%',
          height: 120,
        },
        imagePlaceholder: {
          width: '100%',
          height: 120,
          backgroundColor: '#eeeeee',
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageInactive: {
          opacity: 0.6,
        },
        placeholderText: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#999',
        },
        cardContent: {
          padding: 12,
        },
        cardTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        cardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        infoButton: {
          margin: -8,
          marginTop: -12,
          marginRight: -12,
        },
        priceText: {
          color: '#2e7d32',
          fontWeight: 'bold',
          marginTop: 4,
        },
        noItemsText: {
          textAlign: 'center',
          marginTop: 40,
          fontSize: 16,
          color: '#666',
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        appBar: {
          backgroundColor: colors.elevation.level2,
          alignItems: 'center',
        },
        appBarTitle: {
          ...fonts.titleMedium,
          color: colors.onSurface,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        appBarContent: {},
        spacer: {
          width: 48,
        },
        inactiveBadge: {
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: colors.errorContainer,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
        },
        inactiveBadgeText: {
          fontSize: 12,
          color: colors.onErrorContainer,
          fontWeight: '600',
        },
      }),
    [colors, fonts],
  );

  const handleConfirmExit = () => {
    setShowExitConfirmationModal(false);

    // Store the navigation action before clearing the cart
    const navigationAction =
      pendingNavigationAction || (() => navigation.goBack());

    // Clear the pending action
    setPendingNavigationAction(null);

    // Execute navigation first
    navigationAction();

    // Clear cart after navigation to avoid the beforeRemove check
    setTimeout(() => {
      clearCart();
    }, 100);
  };

  const handleCancelExit = () => {
    setShowExitConfirmationModal(false);
    setPendingNavigationAction(null);
  };

  const handleShowProductDescription = (product: Product) => {
    setSelectedProductForDescription(product);
    setIsDescriptionModalVisible(true);
  };

  const handleCloseDescriptionModal = () => {
    setIsDescriptionModalVisible(false);
    setSelectedProductForDescription(null);
  };

  const renderContent = () => {
    if (isCartVisible) {
      return (
        <SafeAreaView
          style={styles.safeArea}
          edges={['left', 'right', 'bottom']}
        >
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

    const blurhash =
      '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

    const renderItem = ({
      item,
    }: {
      item: Category | SubCategory | Product;
    }) => {
      const imageUrl = item.photo ? getImageUrl(item.photo.path) : null;
      const isActive = item.isActive !== false; // Por defecto true si no existe la propiedad

      const handlePress = () => {
        // No hacer nada si el elemento está inactivo
        if (!isActive) return;

        if (navigationLevel === 'categories') {
          handleCategorySelect(item.id);
        } else if (navigationLevel === 'subcategories') {
          handleSubCategorySelect(item.id);
        } else if ('price' in item) {
          handleProductSelect(item as Product);
        }
      };

      const renderPrice = () => {
        if (
          navigationLevel === 'products' &&
          'price' in item &&
          'hasVariants' in item
        ) {
          const productItem = item as Product;
          if (
            !productItem.hasVariants &&
            productItem.price !== null &&
            productItem.price !== undefined
          ) {
            return (
              <Text style={styles.priceText}>
                ${Number(productItem.price).toFixed(2)}
              </Text>
            );
          }
        }
        return null;
      };

      return (
        <Card
          style={[styles.cardItem, !isActive && styles.cardItemInactive]}
          onPress={handlePress}
          disabled={!isActive}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.itemImage, !isActive && styles.imageInactive]}
              contentFit="cover"
              placeholder={blurhash}
              transition={300}
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                !isActive && styles.imageInactive,
              ]}
            >
              <Text style={styles.placeholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {!isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>INACTIVO</Text>
            </View>
          )}
          <View style={styles.cardContent}>
            {navigationLevel === 'products' &&
            'price' in item &&
            (item as Product).description ? (
              <View style={styles.cardHeader}>
                <Title style={[styles.cardTitle, { flex: 1 }]}>
                  {item.name}
                </Title>
                <IconButton
                  icon="information-outline"
                  size={20}
                  onPress={() => handleShowProductDescription(item as Product)}
                  style={styles.infoButton}
                />
              </View>
            ) : (
              <Title style={styles.cardTitle}>{item.name}</Title>
            )}
            {renderPrice()}
          </View>
        </Card>
      );
    };

    const getItemsToDisplay = () => {
      switch (navigationLevel) {
        case 'categories':
          return getCategories();
        case 'subcategories':
          return getSubcategories();
        case 'products':
          return getProducts();
        default:
          return [];
      }
    };

    const itemsToDisplay = getItemsToDisplay();
    const showCartButton = !isCartVisible && !selectedProduct;

    const backAction = selectedProduct
      ? handleCloseProductModal
      : navigationLevel === 'categories'
        ? () => handleAttemptExit(() => navigation.goBack())
        : handleGoBackInternal;

    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Appbar.Header style={styles.appBar} elevated>
          <Appbar.BackAction onPress={backAction} />
          <Appbar.Content
            title={getNavTitle()}
            titleStyle={styles.appBarTitle}
            style={styles.appBarContent}
          />
          {showCartButton ? (
            <CartButton
              ref={cartButtonRef}
              itemCount={totalItemsCount}
              onPress={handleViewCart}
            />
          ) : (
            <View style={styles.spacer} />
          )}
        </Appbar.Header>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text>Cargando...</Text>
            </View>
          ) : itemsToDisplay.length > 0 ? (
            <FlatList
              data={itemsToDisplay}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.gridContainer}
              numColumns={2}
              columnWrapperStyle={styles.row}
              initialNumToRender={6}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          ) : (
            <Text style={styles.noItemsText}>
              {navigationLevel === 'products'
                ? 'No hay productos disponibles'
                : navigationLevel === 'subcategories'
                  ? 'No hay subcategorías disponibles'
                  : 'No hay categorías disponibles'}
            </Text>
          )}
        </View>

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
        </Portal>
      </SafeAreaView>
    );
  };
  return renderContent();
};

const CreateOrderScreenWithCart = () => (
  <CartProvider>
    <CreateOrderScreen />
  </CartProvider>
);

export default CreateOrderScreenWithCart;
