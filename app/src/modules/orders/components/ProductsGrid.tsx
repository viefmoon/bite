import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import type { Product } from "../../../app/schemas/domain/product.schema"; // Ruta corregida
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list"; // Importar FlashList y tipo
import ProductCard from "./ProductCard";
import ProductDescriptionModal from "./ProductDescriptionModal";
import { useAppTheme } from "@/app/styles/theme";

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  onProductPress: (product: Product) => void;
}

const ProductsGrid = ({
  products,
  isLoading,
  error,
  onProductPress,
}: ProductsGridProps) => {
  const theme = useAppTheme();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      textAlign: "center",
      marginTop: 50,
      color: theme.colors.error,
      paddingHorizontal: theme.spacing.m,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 40,
      marginHorizontal: 20,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Error al cargar los productos: {error?.message || "Error desconocido"}
        </Text>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          No hay productos disponibles en esta categoría.
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlashList
        data={products}
        keyExtractor={(item: Product) => item.id} // Añadir tipo Product
        renderItem={({ item }: ListRenderItemInfo<Product>) => ( // Añadir tipo Product
          <ProductCard 
            product={item} 
            onPress={() => onProductPress(item)}
          /> // Asegurar que onProductPress reciba el item
        )}
        estimatedItemSize={250} // Añadir tamaño estimado
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <ProductDescriptionModal
        visible={modalVisible}
        product={selectedProduct}
        onDismiss={handleCloseModal}
      />
    </>
  );
};

export default ProductsGrid;
