import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { DiffOrder } from '../types/orderHistory';
import { getDiffValue, formatValue, safeGetNestedProperty } from '../utils/orderHistoryUtils';

interface OrderDetailsSectionProps {
  orderDiff: DiffOrder;
  snapshot?: Record<string, unknown>;
  styles: any;
}

export const OrderDetailsSection: React.FC<OrderDetailsSectionProps> = ({
  orderDiff,
  snapshot,
  styles,
}) => {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.orderDetailsContainer,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Text
        variant="labelSmall"
        style={[
          styles.orderDetailsTitle,
          { color: theme.colors.primary },
        ]}
      >
        Detalles de la orden:
      </Text>

      {orderDiff.fields?.orderType && (
        <Text variant="bodySmall" style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tipo:</Text>{' '}
          {formatValue('orderType', getDiffValue(orderDiff.fields.orderType))}
        </Text>
      )}

      {orderDiff.fields?.tableId && (
        <Text variant="bodySmall" style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Mesa:</Text>{' '}
          {safeGetNestedProperty(snapshot, 'table', 'name') ||
            `Mesa ${getDiffValue(orderDiff.fields.tableId)}`}
        </Text>
      )}

      {orderDiff.fields?.notes && (
        <Text variant="bodySmall" style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Notas:</Text>{' '}
          {getDiffValue(orderDiff.fields.notes)}
        </Text>
      )}

      {/* Información de entrega */}
      {orderDiff.deliveryInfo && (
        <>
          {orderDiff.deliveryInfo.recipientName && (
            <Text variant="bodySmall" style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Cliente:</Text>{' '}
              {getDiffValue(orderDiff.deliveryInfo.recipientName)}
            </Text>
          )}

          {orderDiff.deliveryInfo.recipientPhone && (
            <Text variant="bodySmall" style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Teléfono:</Text>{' '}
              {getDiffValue(orderDiff.deliveryInfo.recipientPhone)}
            </Text>
          )}

          {orderDiff.deliveryInfo.fullAddress && (
            <Text variant="bodySmall" style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Dirección:</Text>{' '}
              {getDiffValue(orderDiff.deliveryInfo.fullAddress)}
            </Text>
          )}
        </>
      )}
    </View>
  );
};