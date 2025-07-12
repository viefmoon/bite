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
import { useCreateOrderMutation } from '@/modules/orders/hooks/useOrdersQueries';
import { useCart, CartProvider, CartItem } from '../context/CartContext';
import { CartItemModifier } from '../context/CartContext';
import { Product, Category, SubCategory } from '../types/orders.types';
import { AutoImage } from '@/app/components/common/AutoImage';

import OrderCartDetail from '../components/OrderCartDetail';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import CartButton from '../components/CartButton';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { AudioRecorderWidget } from '@/components/AudioRecorderWidget';
import { AudioOrderModal } from '@/components/AudioOrderModal';
import {
  audioOrderService,
  type AIOrderItem,
} from '@/services/audioOrderService';
import { shiftsService, type Shift } from '@/services/shifts';
import { ShiftStatusBanner } from '../components/ShiftStatusBanner';
import { useAuthStore } from '@/app/store/authStore';
import { canOpenDay } from '@/app/utils/roleUtils';

import { useAppTheme } from '@/app/styles/theme';
import type { OrderDetailsForBackend } from '../components/OrderCartDetail';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';
import { useResponsive } from '@/app/hooks/useResponsive';

interface CartButtonHandle {
  animate: () => void;
}

const CreateOrderScreen = () => {
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const responsive = useResponsive();
  const navigation = useNavigation();
  const {
    isCartEmpty,
    addItem: originalAddItem,
    updateItem,
    isCartVisible,
    showCart,
    hideCart,
    clearCart,
    totalItemsCount,
    setOrderType,
    setDeliveryInfo,
  } = useCart();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  
  // Estado para turno
  const user = useAuthStore((state) => state.user);
  const [shift, setShift] = useState<Shift | null>(null);
  const [dayLoading, setDayLoading] = useState(true);
  
  // Verificar si el usuario puede abrir el turno usando la utilidad centralizada
  const userCanOpenShift = canOpenDay(user);

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
  const isProcessingOrderRef = useRef(false);
  const [selectedProductForDescription, setSelectedProductForDescription] =
    useState<Product | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] =
    useState(false);

  // Estados para el widget de audio
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [audioOrderData, setAudioOrderData] = useState<any>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | undefined>();

  const { data: menu, isLoading } = useGetFullMenu();

  // Cargar estado del turno
  const loadShift = async () => {
    try {
      setDayLoading(true);
      const currentShift = await shiftsService.getCurrentShift();
      setShift(currentShift);
    } catch (error) {
      console.error('Error al cargar turno:', error);
    } finally {
      setDayLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  // Calcular número de columnas para el grid
  const numColumns = useMemo(() => {
    const minItemWidth = 150; // Ancho mínimo de cada tarjeta
    return responsive.getGridColumns(
      minItemWidth,
      responsive.spacing.xs * 2,
      responsive.spacing.m,
    );
  }, [responsive]);

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
      // Don't do anything if cart is empty, modal is already showing, or we're processing an order
      if (isCartEmpty || showExitConfirmationModal || isProcessingOrder) {
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
  }, [navigation, isCartEmpty, showExitConfirmationModal, isProcessingOrder]);

  const handleViewCart = useCallback(() => {
    showCart();
  }, [showCart]);

  const handleCloseCart = useCallback(() => {
    hideCart();
  }, [hideCart]);

  // Actualizar handleConfirmOrder para usar la mutación
  const handleConfirmOrder = async (details: OrderDetailsForBackend) => {
    // Verificación atómica usando ref
    if (isProcessingOrderRef.current) return;
    isProcessingOrderRef.current = true;
    setIsProcessingOrder(true);

    try {
      // Llamar a la mutación para enviar la orden al backend
      const createdOrder = await createOrderMutation.mutateAsync(details);

      // Usar 'shiftOrderNumber' que es lo que devuelve el backend
      showSnackbar({
        message: `Orden #${createdOrder.shiftOrderNumber} creada con éxito`,
        type: 'success',
      });
      hideCart();
      clearCart(); // Limpiar carrito ANTES de navegar

      // Pequeño delay para asegurar que el estado se actualice antes de navegar
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (error) {
      // El manejo de errores con snackbar ya debería estar en el hook useCreateOrderMutation
      const message = getApiErrorMessage(error as Error);
      showSnackbar({
        message: `Error al crear orden: ${message}`,
        type: 'error',
      });
    } finally {
      setIsProcessingOrder(false);
      isProcessingOrderRef.current = false;
    }
  };

  const handleAddItem = (
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
  };

  // Handlers para el widget de audio
  const handleAudioRecordingComplete = useCallback(
    async (audioUri: string, transcription: string) => {
      setIsProcessingAudio(true);
      setShowAudioModal(true);
      setAudioError(undefined);

      try {
        const response = await audioOrderService.processAudioOrder(
          audioUri,
          transcription,
        );

        if (response.success && response.data) {
          setAudioOrderData(response.data);
        } else {
          setAudioError(response.error?.message || 'Error procesando la orden');
        }
      } catch (error) {
        setAudioError('Error al procesar la orden por voz');
      } finally {
        setIsProcessingAudio(false);
      }
    },
    [],
  );

  const handleAudioError = useCallback(
    (error: string) => {
      showSnackbar({
        message: error,
        type: 'error',
      });
    },
    [showSnackbar],
  );

  const handleConfirmAudioOrder = async (
    items: AIOrderItem[],
    deliveryInfo?: any,
    scheduledDelivery?: any,
    orderType?: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN',
  ) => {
    // Procesamos los items detectados por voz y los agregamos al carrito
    try {
      if (!menu) {
        throw new Error('El menú no está disponible');
      }

      let addedCount = 0;
      let failedCount = 0;

      // Procesar cada item detectado
      for (const item of items) {
        let foundProduct: Product | null = null;

        // Buscar el producto en el menú
        outer: for (const category of menu) {
          for (const subcategory of category.subcategories || []) {
            for (const product of subcategory.products || []) {
              if (product.id === item.productId) {
                foundProduct = product;
                break outer;
              }
            }
          }
        }

        if (foundProduct) {
          // Preparar modificadores
          const selectedModifiers: CartItemModifier[] = [];
          if (item.modifiers && item.modifiers.length > 0) {
            for (const modName of item.modifiers) {
              // Buscar el modificador en el producto
              for (const modGroup of foundProduct.modifierGroups || []) {
                const modifier = modGroup.productModifiers?.find(
                  (m) => m.name === modName,
                );
                if (modifier) {
                  selectedModifiers.push({
                    id: modifier.id,
                    modifierGroupId: modGroup.id,
                    name: modifier.name,
                    price: modifier.price || 0,
                  });
                  break;
                }
              }
            }
          }

          // Preparar personalizaciones de pizza
          const pizzaCustomizations = item.pizzaCustomizations?.map((pc) => ({
            pizzaCustomizationId: pc.customizationId,
            half: pc.half as any,
            action: pc.action as any,
          }));

          // Agregar al carrito
          handleAddItem(
            foundProduct,
            item.quantity,
            item.variantId,
            selectedModifiers,
            undefined, // preparationNotes
            pizzaCustomizations,
            0, // pizzaExtraCost (se calculará en el modal si es necesario)
          );

          addedCount++;
        } else {
          failedCount++;
        }
      }

      // Mostrar resultado
      if (addedCount > 0 && failedCount === 0) {
        showSnackbar({
          message: `Se agregaron ${addedCount} producto${addedCount > 1 ? 's' : ''} al carrito`,
          type: 'success',
        });
      } else if (addedCount > 0 && failedCount > 0) {
        showSnackbar({
          message: `Se agregaron ${addedCount} producto${addedCount > 1 ? 's' : ''}, ${failedCount} no se encontraron`,
          type: 'warning',
        });
      } else {
        showSnackbar({
          message: 'No se pudieron agregar los productos al carrito',
          type: 'error',
        });
      }

      // Si hay información de entrega, guardarla en el contexto del carrito
      if (deliveryInfo && Object.keys(deliveryInfo).length > 0) {
        setDeliveryInfo(deliveryInfo);
      }

      // Si se detectó un tipo de orden, actualizarlo en el contexto del carrito

      if (orderType) {
        setOrderType(orderType);
      } else {
      }

      setShowAudioModal(false);
      setAudioOrderData(null);

      // Animar el botón del carrito si se agregaron productos
      if (addedCount > 0) {
        cartButtonRef.current?.animate();
      }
    } catch (error) {
      showSnackbar({
        message: 'Error al agregar los productos al carrito',
        type: 'error',
      });
    }
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
          padding: responsive.spacing.m,
          paddingBottom: 60,
        },
        row: {
          justifyContent: 'flex-start',
        },
        cardItem: {
          flex: 1,
          marginHorizontal: responsive.spacing.xs,
          marginVertical: responsive.spacing.xs,
          overflow: 'hidden',
          borderRadius: theme.roundness,
          elevation: 2,
        },
        cardItemInactive: {
          opacity: 0.5,
        },
        itemImage: {
          width: '100%',
          height: responsive.getResponsiveDimension(100, 140),
        },
        imageInactive: {
          opacity: 0.6,
        },
        cardContent: {
          padding: responsive.spacing.m,
        },
        cardTitle: {
          fontSize: responsive.fontSize.m,
          fontWeight: '600',
          marginBottom: responsive.spacing.xs,
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
        emptyStateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: responsive.spacing.l,
        },
        emptyStateText: {
          textAlign: 'center',
          color: colors.onSurfaceVariant,
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
      const imageSource = item.photo ? item.photo.path : null;
      const isActive = item.isActive !== false; // Por defecto true si no existe la propiedad

      // Verificar si es un producto sin pantalla de preparación
      const isProductWithoutScreen =
        navigationLevel === 'products' &&
        'preparationScreenId' in item &&
        !item.preparationScreenId;

      const handlePress = () => {
        // No hacer nada si el elemento está inactivo o es un producto sin pantalla
        if (!isActive || isProductWithoutScreen) return;

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
          style={[
            styles.cardItem,
            (!isActive || isProductWithoutScreen) && styles.cardItemInactive,
          ]}
          onPress={handlePress}
          disabled={!isActive || isProductWithoutScreen}
        >
          <AutoImage
            source={imageSource}
            style={[
              styles.itemImage,
              (!isActive || isProductWithoutScreen) && styles.imageInactive,
            ]}
            contentFit="cover"
            placeholder={blurhash}
            transition={300}
            placeholderIcon="image-outline"
          />
          {!isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>INACTIVO</Text>
            </View>
          )}
          {isProductWithoutScreen && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>SIN PANTALLA</Text>
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

    // Verificar turno antes de renderizar
    if (!dayLoading && (!shift || shift.status !== 'OPEN')) {
      return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
          <Appbar.Header style={styles.appBar} elevated>
            <Appbar.BackAction onPress={() => navigation.goBack()} />
            <Appbar.Content
              title="Crear Orden"
              titleStyle={styles.appBarTitle}
              style={styles.appBarContent}
            />
          </Appbar.Header>
          <ShiftStatusBanner
            shift={shift}
            loading={dayLoading}
            onOpenShift={() => navigation.goBack()}
            canOpenShift={userCanOpenShift}
          />
          <View style={styles.emptyStateContainer}>
            <Text variant="bodyLarge" style={styles.emptyStateText}>
              {userCanOpenDay
                ? 'Regresa a la pantalla anterior para abrir el turno.'
                : 'Solicita a un administrador que abra el turno.'}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

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
              numColumns={numColumns}
              columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
              initialNumToRender={6}
              maxToRenderPerBatch={10}
              windowSize={5}
              key={`grid-${numColumns}`} // Key para forzar re-render cuando cambian las columnas
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

        {/* Widget de grabación de audio */}
        {!isCartVisible && !selectedProduct && (
          <AudioRecorderWidget
            onRecordingComplete={handleAudioRecordingComplete}
            onError={handleAudioError}
          />
        )}
      </SafeAreaView>
    );
  };
  return renderContent();
};

const CreateOrderScreenWithCart = () => {
  return (
    <CartProvider>
      <CreateOrderScreen />
    </CartProvider>
  );
};

export default CreateOrderScreenWithCart;
