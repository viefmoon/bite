import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  Divider,
  IconButton,
} from 'react-native-paper';
import {
  OrderForFinalization,
  OrderItemForFinalization,
} from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';

interface OrderDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  order: OrderForFinalization | null;
}

interface GroupedItem {
  item: OrderItemForFinalization;
  quantity: number;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onDismiss,
  order,
}) => {
  const theme = useAppTheme();

  // Agrupar items idénticos
  const groupedItems = React.useMemo(() => {
    if (!order) return [];

    const groups = new Map<string, GroupedItem>();

    order.orderItems.forEach((item) => {
      // Crear una clave única basada en producto, variante y modificadores
      const modifierKeys =
        item.modifiers && item.modifiers.length > 0
          ? item.modifiers
              .map((m) => m.id)
              .sort()
              .join(',')
          : '';
      const key = `${item.product.id}-${item.productVariant?.id || ''}-${modifierKeys}-${item.preparationNotes || ''}`;

      if (groups.has(key)) {
        const existing = groups.get(key)!;
        existing.quantity += item.quantity;
      } else {
        groups.set(key, { item, quantity: item.quantity });
      }
    });

    return Array.from(groups.values());
  }, [order]);

  const totalItems =
    order?.orderItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (!order) return null;

  const renderGroupedItem = ({ item, quantity }: GroupedItem) => {
    const itemTotal = parseFloat(item.finalPrice) * quantity;

    return (
      <Surface
        key={`${item.id}-${quantity}`}
        style={styles.itemCard}
        elevation={0}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
              {quantity}x {item.product.name}
            </Text>
            {item.productVariant && (
              <Text
                style={[
                  styles.variantText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.productVariant.name}
              </Text>
            )}
          </View>
          <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
            ${itemTotal.toFixed(2)}
          </Text>
        </View>

        {item.modifiers && item.modifiers.length > 0 && (
          <View style={styles.modifiers}>
            {item.modifiers.map((modifier) => (
              <Text
                key={modifier.id}
                style={[
                  styles.modifierText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                + {modifier.name} ($
                {(typeof modifier.price === 'string'
                  ? parseFloat(modifier.price)
                  : modifier.price
                ).toFixed(2)}
                )
              </Text>
            ))}
          </View>
        )}

        {item.preparationNotes && (
          <View style={styles.notes}>
            <Text
              style={[
                styles.notesLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Notas:
            </Text>
            <Text
              style={[
                styles.notesText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {item.preparationNotes}
            </Text>
          </View>
        )}
      </Surface>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Orden #{order.dailyNumber}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        <Divider />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.itemsList}>
            {groupedItems.map((groupedItem) => renderGroupedItem(groupedItem))}
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.footer}>
          <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
            Total:
          </Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            $
            {typeof order.total === 'string'
              ? parseFloat(order.total).toFixed(2)
              : order.total.toFixed(2)}
          </Text>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  closeButton: {
    margin: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    maxHeight: 400,
  },
  itemsList: {
    padding: 20,
    gap: 12,
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  variantText: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  modifiers: {
    marginTop: 6,
    paddingLeft: 16,
  },
  modifierText: {
    fontSize: 11,
    marginTop: 2,
  },
  notes: {
    marginTop: 6,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
});
