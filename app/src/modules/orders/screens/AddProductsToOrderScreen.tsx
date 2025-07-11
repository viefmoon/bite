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
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { useGetFullMenu } from '../hooks/useMenuQueries';
import { Product, Category, SubCategory } from '../types/orders.types';
import { AutoImage } from '@/app/components/common/AutoImage';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import SimpleProductDescriptionModal from '../components/SimpleProductDescriptionModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import CartButton from '../components/CartButton';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useAppTheme } from '@/app/styles/theme';
import type { OrdersStackScreenProps } from '@/app/navigation/types';
import { CartItem, CartItemModifier } from '../context/CartContext';
import type { SelectedPizzaCustomization } from '@/app/schemas/domain/order.schema';

// Props de navegación
type AddProductsRouteProps = {
  orderId: string;
  orderNumber: number;
  existingOrderItemsCount?: number; // Número de items que ya están en la orden
  existingTempProducts?: CartItem[]; // Productos temporales existentes
  onProductsAdded?: (products: CartItem[]) => void;
};

interface CartButtonHandle {
  animate: () => void;
}

const AddProductsToOrderScreen = () => {
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  const navigation = useNavigation();
  const route =
    useRoute<OrdersStackScreenProps<'AddProductsToOrder'>['route']>();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const cartButtonRef = useRef<CartButtonHandle>(null);

  // Obtener parámetros de navegación
  const {
    orderId,
    orderNumber,
    existingTempProducts,
    existingOrderItemsCount,
    onProductsAdded,
  } = route.params as AddProductsRouteProps;

  // Estados para navegación y selección
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
  const [selectedProductForDescription, setSelectedProductForDescription] =
    useState<Product | null>(null);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] =
    useState(false);

  // Estado local para productos seleccionados - inicializar con productos existentes si los hay
  const [selectedProducts, setSelectedProducts] = useState<CartItem[]>(
    existingTempProducts || [],
  );

  const { data: menu, isLoading } = useGetFullMenu();

  // Calcular total de items (incluir items existentes de la orden)
  const totalItemsCount = useMemo(() => {
    const newItemsCount = selectedProducts.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const existingItemsCount = existingOrderItemsCount || 0;
    return newItemsCount + existingItemsCount;
  }, [selectedProducts, existingOrderItemsCount]);

  // Mostrar mensaje si hay productos existentes al entrar
  useEffect(() => {
    if (existingTempProducts && existingTempProducts.length > 0) {
      const totalItems = existingTempProducts.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      showSnackbar({
        message: `${totalItems} producto${totalItems > 1 ? 's' : ''} recuperado${totalItems > 1 ? 's' : ''}`,
        type: 'info',
      });
    }
  }, []);

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
      // Añadir producto directamente sin personalización
      addItemToSelection(product, 1);
    }
  };

  const addItemToSelection = (
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

    // Buscar si ya existe un item idéntico en la selección actual
    const existingIndex = selectedProducts.findIndex((item) => {
      // Verificar si es el mismo producto, variante, modificadores y notas
      if (item.productId !== product.id) return false;
      if (item.variantId !== selectedVariantId) return false;
      if (item.preparationNotes !== preparationNotes) return false;

      // Comparar modificadores
      const itemModifierIds = item.modifiers
        .map((m) => m.id)
        .sort()
        .join(',');
      const newModifierIds = (selectedModifiers || [])
        .map((m) => m.id)
        .sort()
        .join(',');

      if (itemModifierIds !== newModifierIds) return false;

      // Comparar pizza customizations
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
      // Si existe, actualizar la cantidad
      setSelectedProducts((prev) => {
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Recalcular el precio total correctamente
        const modifiersTotal = existingItem.modifiers.reduce(
          (sum, mod) => sum + Number(mod.price || 0),
          0,
        );
        const pizzaCostTotal = existingItem.pizzaExtraCost || 0;
        const unitPriceWithModifiers =
          Number(existingItem.unitPrice || 0) + modifiersTotal + pizzaCostTotal;

        updated[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: unitPriceWithModifiers * newQuantity,
        };
        return updated;
      });
    } else {
      // Si no existe, agregar nuevo item
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

    // Animar el carrito
    cartButtonRef.current?.animate();

    showSnackbar({
      message: `${product.name} añadido`,
      type: 'success',
    });
  };

  const updateItemInSelection = (
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
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string,
    selectedPizzaCustomizations?: SelectedPizzaCustomization[],
    pizzaExtraCost?: number,
  ) => {
    if (editingItem) {
      // Si estamos editando, actualizar el item existente
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
      // Si es nuevo, añadir a la selección
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
  };

  const handleEditItem = (item: CartItem) => {
    // Buscar el producto completo en el menú
    if (!menu || !Array.isArray(menu)) return;

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
    }
  };

  const handleCloseProductModal = useCallback(() => {
    setSelectedProduct(null);
    setEditingItem(null);
  }, []);

  const handleConfirmSelection = () => {
    // No mostrar mensaje si no hay productos nuevos seleccionados
    // pero permitir salir igualmente

    // Llamar callback con todos los productos (existentes + nuevos)
    if (onProductsAdded) {
      onProductsAdded(selectedProducts);
    }

    // Navegar de vuelta al resumen de orden
    navigation.goBack();
  };

  const handleBack = () => {
    if (selectedProduct) {
      setSelectedProduct(null);
    } else if (navigationLevel === 'products') {
      setNavigationLevel('subcategories');
      setSelectedSubcategoryId(null);
    } else if (navigationLevel === 'subcategories') {
      setNavigationLevel('categories');
      setSelectedCategoryId(null);
    } else {
      // Al salir, guardar los productos seleccionados
      if (onProductsAdded) {
        onProductsAdded(selectedProducts);
      }
      navigation.goBack();
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

  const selectedCategory = menu?.find(
    (cat: Category) => cat.id === selectedCategoryId,
  );
  const selectedSubCategory = selectedCategory?.subcategories?.find(
    (sub: SubCategory) => sub.id === selectedSubcategoryId,
  );

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

  const handleShowProductDescription = (product: Product) => {
    setSelectedProductForDescription(product);
    setIsDescriptionModalVisible(true);
  };

  const handleCloseDescriptionModal = () => {
    setIsDescriptionModalVisible(false);
    setSelectedProductForDescription(null);
  };

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
        imageInactive: {
          opacity: 0.6,
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

  const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const renderItem = ({ item }: { item: Category | SubCategory | Product }) => {
    const imageSource = (() => {
      const photoPath = item.photo?.path || item.photo;
      return photoPath || null;
    })();
    const isActive = item.isActive !== false;

    // Verificar si es un producto sin pantalla de preparación
    const isProductWithoutScreen =
      navigationLevel === 'products' &&
      'preparationScreenId' in item &&
      !item.preparationScreenId;

    const handlePress = () => {
      if (!isActive || isProductWithoutScreen) return;

      if (navigationLevel === 'categories') {
        handleCategorySelect(item.id);
      } else if (navigationLevel === 'subcategories') {
        handleSubCategorySelect(item.id);
      } else if ('price' in item) {
        handleProductSelect(item as Product);
      }
    };

    const handleLongPress = () => {
      if (
        navigationLevel === 'products' &&
        'price' in item &&
        isActive &&
        'description' in item &&
        (item as Product).description &&
        (item as Product).description.trim() !== ''
      ) {
        handleShowProductDescription(item as Product);
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
        onLongPress={handleLongPress}
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
        <Card.Content style={styles.cardContent}>
          {navigationLevel === 'products' &&
          'price' in item &&
          (item as Product).description ? (
            <View style={styles.cardHeader}>
              <Title style={[styles.cardTitle, { flex: 1 }]}>{item.name}</Title>
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
        </Card.Content>
        {!isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>No disponible</Text>
          </View>
        )}
        {isProductWithoutScreen && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>SIN PANTALLA</Text>
          </View>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const currentData =
    navigationLevel === 'categories'
      ? getCategories()
      : navigationLevel === 'subcategories'
        ? getSubcategories()
        : getProducts();

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Appbar.Header style={styles.appBar}>
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content
            title={getNavTitle()}
            titleStyle={styles.appBarTitle}
            style={styles.appBarContent}
          />
          <CartButton
            ref={cartButtonRef}
            itemCount={totalItemsCount}
            onPress={handleConfirmSelection}
          />
        </Appbar.Header>

        <View style={styles.content}>
          {currentData.length === 0 ? (
            <Text style={styles.noItemsText}>
              {navigationLevel === 'categories'
                ? 'No hay categorías disponibles'
                : navigationLevel === 'subcategories'
                  ? 'No hay subcategorías disponibles'
                  : 'No hay productos disponibles'}
            </Text>
          ) : (
            <FlatList
              data={currentData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Modal de personalización de producto */}
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

          {/* Modal de descripción del producto */}
          {selectedProductForDescription && (
            <SimpleProductDescriptionModal
              visible={isDescriptionModalVisible}
              product={selectedProductForDescription}
              onDismiss={handleCloseDescriptionModal}
            />
          )}
        </Portal>
      </View>
    </SafeAreaView>
  );
};

export default AddProductsToOrderScreen;
