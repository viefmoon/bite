import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Checkbox, Chip, IconButton } from 'react-native-paper';
import { OrderForFinalization } from '../types/orderFinalization.types';
import { useAppTheme } from '@/app/styles/theme';

interface OrderCardProps {
  order: OrderForFinalization;
  isSelected: boolean;
  onToggleSelection: (orderId: string) => void;
  onShowDetails: (order: OrderForFinalization) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected,
  onToggleSelection,
  onShowDetails,
}) => {
  const theme = useAppTheme();

  const getOrderTypeIcon = () => {
    switch (order.orderType) {
      case 'TAKEOUT':
        return 'bag-personal-outline';
      case 'DELIVERY':
        return 'truck-delivery';
      case 'DINE_IN':
        return 'silverware-fork-knife';
      default:
        return 'receipt';
    }
  };

  const getOrderTypeLabel = () => {
    switch (order.orderType) {
      case 'TAKEOUT':
        return 'Para llevar';
      case 'DELIVERY':
        return 'Domicilio';
      case 'DINE_IN':
        return 'Mesa';
      default:
        return 'Orden';
    }
  };

  const getStatusColor = () => {
    switch (order.orderStatus) {
      case 'READY':
        return theme.colors.primary;
      case 'DELIVERED':
        return theme.colors.secondary;
      case 'IN_PROGRESS':
        return theme.colors.tertiary;
      case 'PENDING':
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusLabel = () => {
    switch (order.orderStatus) {
      case 'READY':
        return 'Listo';
      case 'DELIVERED':
        return 'Entregado';
      case 'IN_PROGRESS':
        return 'En preparación';
      case 'PENDING':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: isSelected
            ? theme.colors.primaryContainer
            : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : 'transparent',
        },
      ]}
      elevation={isSelected ? 2 : 1}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={() => onToggleSelection(order.id)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <Text
                  style={[
                    styles.orderNumber,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Orden #{order.dailyNumber}
                </Text>
                <Chip
                  icon={getOrderTypeIcon()}
                  style={[
                    styles.typeChip,
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                  textStyle={[
                    styles.chipText,
                    { color: theme.colors.onSecondaryContainer },
                  ]}
                  compact={true}
                  mode="flat"
                >
                  {getOrderTypeLabel()}
                </Chip>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor() + '20' },
                  ]}
                  textStyle={[styles.chipText, { color: getStatusColor() }]}
                  compact={true}
                  mode="flat"
                >
                  {getStatusLabel()}
                </Chip>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.time, { color: theme.colors.primary }]}>
              {new Date(order.createdAt).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.priceAndCheckbox}>
              <Text style={[styles.total, { color: theme.colors.primary }]}>
                $
                {typeof order.total === 'string'
                  ? parseFloat(order.total).toFixed(2)
                  : order.total.toFixed(2)}
              </Text>
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => onToggleSelection(order.id)}
                color={theme.colors.primary}
                style={styles.checkbox}
              />
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailsContent}>
            {order.customerName && (
              <Text
                style={[
                  styles.customerName,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {order.customerName}{' '}
                {order.phoneNumber && `• ${order.phoneNumber}`}
              </Text>
            )}

            {order.orderType === 'DINE_IN' && order.table && (
              <Text
                style={[
                  styles.tableInfo,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                Mesa {order.table.number}{' '}
                {order.table.area?.name && `- ${order.table.area.name}`}
              </Text>
            )}

            {order.orderType === 'DELIVERY' && order.deliveryAddress && (
              <Text
                style={[
                  styles.address,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {order.deliveryAddress}
              </Text>
            )}

            <View style={styles.itemsInfo}>
              <Text
                style={[
                  styles.itemsCount,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                {order.orderItems.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ) === 1
                  ? 'artículo'
                  : 'artículos'}
              </Text>
            </View>
          </View>

          <IconButton
            icon="format-list-bulleted"
            size={18}
            onPress={() => onShowDetails(order)}
            style={styles.detailsButton}
            iconColor={theme.colors.primary}
          />
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  content: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeChip: {
    height: 28,
    marginVertical: 0,
    minWidth: 65,
    paddingHorizontal: 6,
  },
  statusChip: {
    height: 28,
    marginVertical: 0,
    minWidth: 65,
    paddingHorizontal: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  priceAndCheckbox: {
    alignItems: 'center',
    gap: 4,
  },
  checkbox: {
    margin: 0,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  detailsContent: {
    flex: 1,
  },
  detailsButton: {
    margin: 0,
    marginLeft: 8,
  },
  customerName: {
    fontSize: 11,
    fontWeight: '500',
  },
  tableInfo: {
    fontSize: 11,
  },
  address: {
    fontSize: 10,
  },
  itemsInfo: {
    marginTop: 2,
  },
  itemsCount: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
