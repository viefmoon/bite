import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { KitchenOrder } from '../schema/kitchen.schema';
import { OrderItemRow } from './OrderItemRow';

interface OrderCardItemsProps {
  order: KitchenOrder;
  onToggleItemPrepared: (itemId: string, currentStatus: boolean) => void;
  isOrderInPreparation: boolean;
}

export const OrderCardItems: React.FC<OrderCardItemsProps> = ({
  order,
  onToggleItemPrepared,
  isOrderInPreparation,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);

  if (!order.items || order.items.length === 0) {
    return (
      <View style={styles.emptyItemsContainer}>
        <Text variant="bodyLarge" style={styles.emptyItemsText}>
          No hay productos para mostrar
        </Text>
      </View>
    );
  }

  const myScreenItems = order.items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => item.belongsToMyScreen);

  const otherScreenItems = order.items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => !item.belongsToMyScreen);

  const allItems = [...myScreenItems, ...otherScreenItems].sort(
    (a, b) => a.originalIndex - b.originalIndex,
  );

  return (
    <View style={styles.itemsWrapper}>
      <ScrollView
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {allItems.map(({ item }, index) => (
          <OrderItemRow
            key={`${item.id}-${index}`}
            item={item}
            onTogglePrepared={onToggleItemPrepared}
            isOrderInPreparation={isOrderInPreparation}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    itemsWrapper: {
      flex: 1,
      minHeight: responsive.isTablet ? 100 : 60,
    },
    itemsContainer: {
      flex: 1,
    },
    emptyItemsContainer: {
      padding: responsive.spacingPreset.s,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive.getResponsiveDimension(60, 80),
    },
    emptyItemsText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.6,
    },
  });
