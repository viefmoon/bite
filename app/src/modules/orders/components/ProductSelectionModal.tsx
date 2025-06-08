import React, { useState, useMemo, useRef, useCallback } from "react";
import { StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import {
  Text,
  Portal,
  Modal,
  Card,
  Title,
  Appbar,
} from "react-native-paper";
import { Image } from "expo-image";
import { useAppTheme } from "@/app/styles/theme";
import { useGetFullMenu } from "../hooks/useMenuQueries";
import {
  FullMenuProduct as Product,
  FullMenuCategory as Category,
  FullMenuSubCategory as SubCategory,
} from "../types/orders.types";
import { getImageUrl } from "@/app/lib/imageUtils";
import ProductCustomizationModal from "./ProductCustomizationModal";
import { CartItemModifier } from "../context/CartContext";

interface ProductSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAddProduct: (
    product: Product,
    quantity: number,
    variantId?: string,
    modifiers?: CartItemModifier[],
    preparationNotes?: string
  ) => void;
}

interface CartButtonHandle {
  animate: () => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  visible,
  onDismiss,
  onAddProduct,
}) => {
  const theme = useAppTheme();
  const { colors, fonts } = theme;
  
  const [navigationLevel, setNavigationLevel] = useState<
    "categories" | "subcategories" | "products"
  >("categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: menu, isLoading } = useGetFullMenu();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
    setNavigationLevel("subcategories");
  };

  const handleSubCategorySelect = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setNavigationLevel("products");
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
      // Si no necesita personalización, añadir directamente
      onAddProduct(product, 1);
      // Opcional: cerrar el modal o volver a categorías
      resetNavigation();
    }
  };

  const handleCloseProductModal = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const handleGoBack = () => {
    if (selectedProduct) {
      handleCloseProductModal();
    } else if (navigationLevel === "products") {
      setNavigationLevel("subcategories");
      setSelectedSubcategoryId(null);
    } else if (navigationLevel === "subcategories") {
      setNavigationLevel("categories");
      setSelectedCategoryId(null);
    } else {
      onDismiss();
    }
  };

  const resetNavigation = () => {
    setNavigationLevel("categories");
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedProduct(null);
  };

  const handleDismiss = () => {
    resetNavigation();
    onDismiss();
  };

  const handleAddItem = (
    product: Product,
    quantity: number,
    selectedVariantId?: string,
    selectedModifiers?: CartItemModifier[],
    preparationNotes?: string
  ) => {
    onAddProduct(product, quantity, selectedVariantId, selectedModifiers, preparationNotes);
    setSelectedProduct(null);
    // Opcional: volver a categorías después de añadir
    resetNavigation();
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
    selectedCategory && Array.isArray(selectedCategory.subcategories)
      ? selectedCategory.subcategories.find(
          (sub: SubCategory) => sub.id === selectedSubcategoryId
        )
      : null;

  const getNavTitle = useCallback(() => {
    if (selectedProduct) {
      return selectedProduct.name;
    }
    switch (navigationLevel) {
      case "categories":
        return "Seleccionar Categoría";
      case "subcategories":
        return selectedCategory?.name
          ? `Categoría: ${selectedCategory.name}`
          : "Subcategorías";
      case "products":
        return selectedSubCategory?.name
          ? `Subcategoría: ${selectedSubCategory.name}`
          : "Productos";
      default:
        return "Categorías";
    }
  }, [navigationLevel, selectedCategory, selectedSubCategory, selectedProduct]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContent: {
          backgroundColor: colors.background,
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          position: "absolute",
          top: 0,
          left: 0,
        },
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
        },
        gridContainer: {
          padding: 12,
          paddingBottom: 60,
        },
        row: {
          justifyContent: "flex-start",
        },
        cardItem: {
          width: "48%",
          marginHorizontal: "1%",
          marginVertical: 4,
          overflow: "hidden",
          borderRadius: 8,
          elevation: 2,
        },
        itemImage: {
          width: "100%",
          height: 120,
        },
        imagePlaceholder: {
          width: "100%",
          height: 120,
          backgroundColor: "#eeeeee",
          justifyContent: "center",
          alignItems: "center",
        },
        placeholderText: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#999",
        },
        cardContent: {
          padding: 12,
        },
        cardTitle: {
          fontSize: 16,
          fontWeight: "bold",
          marginBottom: 4,
        },
        priceText: {
          color: "#2e7d32",
          fontWeight: "bold",
          marginTop: 4,
        },
        noItemsText: {
          textAlign: "center",
          marginTop: 40,
          fontSize: 16,
          color: "#666",
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        appBar: {
          backgroundColor: colors.elevation.level2,
          alignItems: 'center',
        },
        appBarTitle: {
          ...fonts.titleMedium,
          color: colors.onSurface,
          fontWeight: "bold",
          textAlign: "center",
        },
        appBarContent: {},
        spacer: {
          width: 48,
        },
      }),
    [colors, fonts]
  );

  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

  const renderItem = ({
    item,
  }: {
    item: Category | SubCategory | Product;
  }) => {
    const imageUrl = item.photo ? getImageUrl(item.photo.path) : null;

    const handlePress = () => {
      if (navigationLevel === "categories") {
        handleCategorySelect(item.id);
      } else if (navigationLevel === "subcategories") {
        handleSubCategorySelect(item.id);
      } else if ("price" in item) {
        handleProductSelect(item as Product);
      }
    };

    const renderPrice = () => {
      if (
        navigationLevel === "products" &&
        "price" in item &&
        "hasVariants" in item
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
      <Card style={styles.cardItem} onPress={handlePress}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.itemImage}
            contentFit="cover"
            placeholder={blurhash}
            transition={300}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Title style={styles.cardTitle}>{item.name}</Title>
          {renderPrice()}
        </View>
      </Card>
    );
  };

  const getItemsToDisplay = () => {
    switch (navigationLevel) {
      case "categories":
        return getCategories();
      case "subcategories":
        return getSubcategories();
      case "products":
        return getProducts();
      default:
        return [];
    }
  };

  const itemsToDisplay = getItemsToDisplay();

  return (
    <Portal>
      <Modal
        visible={visible && !selectedProduct}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.container}>
          <Appbar.Header style={styles.appBar} elevated>
            <Appbar.BackAction onPress={handleGoBack} />
            <Appbar.Content
              title={getNavTitle()}
              titleStyle={styles.appBarTitle}
              style={styles.appBarContent}
            />
            <View style={styles.spacer} />
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
                {navigationLevel === "products"
                  ? "No hay productos disponibles"
                  : navigationLevel === "subcategories"
                    ? "No hay subcategorías disponibles"
                    : "No hay categorías disponibles"}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {selectedProduct && productNeedsCustomization(selectedProduct) && (
        <ProductCustomizationModal
          visible={true}
          product={selectedProduct}
          onAddToCart={handleAddItem}
          onDismiss={handleCloseProductModal}
        />
      )}
    </Portal>
  );
};

export default ProductSelectionModal;