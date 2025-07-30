import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Checkbox, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  photo?: any;
  price?: string | number | null | undefined;
  isAssociated: boolean;
  currentPreparationScreenId: string | null;
}

interface ProductRowProps {
  product: Product;
  isSelected: boolean;
  screenId: string;
  onToggleSelection: (productId: string) => void;
}

export const ProductRow = memo<ProductRowProps>(
  ({ product, isSelected, screenId, onToggleSelection }) => {
    const theme = useTheme();

    const showWarning =
      product.currentPreparationScreenId &&
      product.currentPreparationScreenId !== screenId;

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => onToggleSelection(product.id)}
      >
        <View style={styles.productInfo}>
          <Text variant="bodyMedium">{product.name}</Text>
          {showWarning && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons
                name="alert"
                size={12}
                color={theme.colors.error}
              />
              <Text
                variant="bodySmall"
                style={[styles.warningText, { color: theme.colors.error }]}
              >
                Asignado a otra pantalla
              </Text>
            </View>
          )}
        </View>
        <Checkbox.Android
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => onToggleSelection(product.id)}
        />
      </TouchableOpacity>
    );
  },
);

ProductRow.displayName = 'ProductRow';

const styles = StyleSheet.create({
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 56, // 20 (subcategory) + 20 (products) + 16 (product)
  },
  productInfo: {
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  warningText: {
    marginLeft: 4,
    fontSize: 11,
  },
});
