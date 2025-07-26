import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { 
  safeGetProperty, 
  hasArrayItems, 
  safeJoinArray 
} from '../utils/orderHistoryUtils';

interface ProductItemRendererProps {
  item: Record<string, unknown>;
  index: number;
  type: 'added' | 'removed' | 'modified';
  styles: any;
}

export const ProductItemRenderer: React.FC<ProductItemRendererProps> = ({
  item,
  index,
  type,
  styles,
}) => {
  const theme = useAppTheme();

  const getContainerStyle = () => {
    switch (type) {
      case 'added':
        return {
          borderLeftColor: theme.colors.primary + '50',
          backgroundColor: theme.colors.surface,
        };
      case 'removed':
        return {
          borderLeftColor: theme.colors.error + '50',
          backgroundColor: theme.colors.surface,
        };
      case 'modified':
        return {
          borderLeftColor: theme.colors.warning + '50',
          backgroundColor: theme.colors.surface,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
        };
    }
  };

  return (
    <View
      key={`${type}-${index}`}
      style={[
        styles.productItemBorder,
        getContainerStyle(),
      ]}
    >
      <Text variant="bodySmall" style={styles.productNameText}>
        {safeGetProperty(item, 'productName')}
        {safeGetProperty(item, 'variantName')
          ? ` - ${safeGetProperty(item, 'variantName')}`
          : ''}
      </Text>

      {hasArrayItems(item, 'modifiers') && (
        <Text
          variant="labelSmall"
          style={[
            styles.modifierText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Modificadores: {safeJoinArray(item, 'modifiers')}
        </Text>
      )}

      {hasArrayItems(item, 'customizations') && (
        <Text
          variant="labelSmall"
          style={[
            styles.modifierText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Personalizaciones: {safeJoinArray(item, 'customizations')}
        </Text>
      )}

      {safeGetProperty(item, 'specialInstructions') && (
        <Text
          variant="labelSmall"
          style={[
            styles.modifierText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Instrucciones: {safeGetProperty(item, 'specialInstructions')}
        </Text>
      )}

      {safeGetProperty(item, 'quantity') && (
        <Text
          variant="labelSmall"
          style={[
            styles.quantityText,
            { color: theme.colors.primary },
          ]}
        >
          Cantidad: {safeGetProperty(item, 'quantity')}
        </Text>
      )}

      {safeGetProperty(item, 'price') && (
        <Text
          variant="labelSmall"
          style={[
            styles.priceText,
            { color: theme.colors.onSurface },
          ]}
        >
          Precio: ${safeGetProperty(item, 'price')}
        </Text>
      )}
    </View>
  );
};