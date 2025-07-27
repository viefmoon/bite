import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  KitchenOrder,
  OrderTypeEnum,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';

interface OrderCardHeaderProps {
  order: KitchenOrder;
  isSwipeable: boolean;
}

const ORDER_TYPE_CONFIG = {
  [OrderTypeEnum.DELIVERY]: {
    label: 'DOMICILIO',
    icon: 'moped' as const,
    backgroundColor: '#FFEBEE',
    textColor: '#C62828',
  },
  [OrderTypeEnum.TAKE_AWAY]: {
    label: 'PARA LLEVAR',
    icon: 'shopping-outline' as const,
    backgroundColor: '#E0F2F1',
    textColor: '#00838F',
  },
  [OrderTypeEnum.DINE_IN]: {
    label: 'MESA',
    icon: 'silverware-fork-knife' as const,
    backgroundColor: '#E3F2FD',
    textColor: '#1565C0',
  },
};

export const OrderCardHeader: React.FC<OrderCardHeaderProps> = ({
  order,
  isSwipeable,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);

  const getOrderTypeColor = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return theme.colors.error;
      case OrderTypeEnum.TAKE_AWAY:
        return '#00ACC1';
      case OrderTypeEnum.DINE_IN:
        return theme.colors.primary;
      default:
        return theme.colors.surface;
    }
  };

  const typeConfig = ORDER_TYPE_CONFIG[order.orderType] || {
    label: '',
    icon: 'help-circle-outline' as const,
    backgroundColor: theme.colors.surfaceVariant,
    textColor: theme.colors.onSurfaceVariant,
  };

  const getOrderPreparationStatus = () => {
    if (!order.items || order.items.length === 0) {
      return {
        label: 'Sin items',
        color: '#E0E0E0',
        textColor: '#424242',
        borderColor: '#BDBDBD',
      };
    }

    const myItems = order.items.filter((item) => item.belongsToMyScreen);
    if (myItems.length === 0) {
      return {
        label: 'Sin items asignados',
        color: '#E0E0E0',
        textColor: '#424242',
        borderColor: '#BDBDBD',
      };
    }

    switch (order.myScreenStatus) {
      case PreparationScreenStatus.READY:
        return {
          label: 'Lista',
          color: '#4CAF50',
          textColor: '#FFFFFF',
          borderColor: null,
        };
      case PreparationScreenStatus.IN_PREPARATION:
        return {
          label: 'En preparación',
          color: '#FF6B35',
          textColor: '#FFFFFF',
          borderColor: null,
        };
      case PreparationScreenStatus.PENDING:
      default:
        return {
          label: 'Pendiente',
          color: '#9C27B0',
          textColor: '#FFFFFF',
          borderColor: null,
        };
    }
  };

  const hasOrderDetails = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return !!order.deliveryAddress;
      case OrderTypeEnum.TAKE_AWAY:
        return !!order.receiptName;
      case OrderTypeEnum.DINE_IN:
        return !!(order.areaName || order.tableName);
      default:
        return false;
    }
  };

  const getOrderDetails = () => {
    switch (order.orderType) {
      case OrderTypeEnum.DELIVERY:
        return `📍 ${order.deliveryAddress}${order.deliveryPhone ? `\n📱 ${order.deliveryPhone}` : ''}`;
      case OrderTypeEnum.TAKE_AWAY:
        return `👤 ${order.receiptName}${order.customerPhone ? `\n📱 ${order.customerPhone}` : ''}`;
      case OrderTypeEnum.DINE_IN:
        return `🪑 ${order.areaName} - ${order.tableName}`;
      default:
        return '';
    }
  };

  const orderStatus = getOrderPreparationStatus();

  return (
    <View
      style={[
        styles.header,
        isSwipeable ? styles.headerSwipeable : null,
        { backgroundColor: getOrderTypeColor() },
      ]}
    >
      <View style={styles.headerLeft}>
        <Text style={[styles.orderNumber, styles.headerText]}>
          #{order.shiftOrderNumber}
        </Text>
        {hasOrderDetails() && (
          <Text
            style={[styles.headerDetails, styles.headerText]}
            numberOfLines={2}
          >
            {getOrderDetails()}
          </Text>
        )}

        {order.isFromWhatsApp && (
          <View style={styles.whatsappBadgeContainer}>
            <View style={styles.whatsappBadge}>
              <Icon name="whatsapp" size={12} color={theme.colors.surface} />
            </View>
          </View>
        )}
      </View>
      <View
        style={[
          styles.headerRight,
          isSwipeable ? styles.headerRightSwipeable : styles.headerRightNormal,
        ]}
      >
        <View
          style={[
            styles.typeChip,
            isSwipeable ? styles.typeChipSwipeable : styles.typeChipNormal,
            isSwipeable
              ? null
              : { backgroundColor: typeConfig.backgroundColor },
          ]}
        >
          <Icon
            name={typeConfig.icon}
            size={responsive.isWeb ? 18 : 14}
            color={isSwipeable ? theme.colors.surface : typeConfig.textColor}
            style={styles.typeChipIcon}
          />
          <Text
            style={[
              styles.typeChipText,
              isSwipeable ? styles.headerText : { color: typeConfig.textColor },
            ]}
          >
            {typeConfig.label}
          </Text>
        </View>
        <View
          style={[
            styles.statusChip,
            isSwipeable ? styles.statusChipSwipeable : styles.statusChipNormal,
            { backgroundColor: orderStatus.color },
            orderStatus.label === 'En progreso'
              ? styles.statusChipWithBorder
              : null,
            orderStatus.borderColor && !isSwipeable
              ? [
                  styles.statusChipWithBorderColor,
                  { borderColor: orderStatus.borderColor },
                ]
              : null,
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              {
                color:
                  isSwipeable && orderStatus.label === 'En progreso'
                    ? theme.colors.onSurface
                    : isSwipeable
                      ? theme.colors.surface
                      : orderStatus.textColor,
              },
            ]}
          >
            {orderStatus.label}
          </Text>
        </View>
        <Text
          style={[
            styles.headerTime,
            isSwipeable ? styles.headerText : { color: theme.colors.surface },
          ]}
        >
          {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.l
        : responsive.spacingPreset.m,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      borderTopLeftRadius: theme.roundness,
      borderTopRightRadius: theme.roundness,
      minHeight: responsive.isWeb
        ? 80
        : responsive.getResponsiveDimension(50, 60),
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'column',
      gap: responsive.spacingPreset.xxxs,
    },
    headerDetails: {
      fontSize: responsive.isWeb ? 16 : responsive.isTablet ? 12 : 13,
      lineHeight: responsive.isWeb ? 22 : responsive.isTablet ? 16 : 18,
      opacity: 0.95,
      marginTop: responsive.spacingPreset.xxxs,
      fontWeight: '500',
    },
    headerRight: {
      alignItems: 'flex-end',
      gap: responsive.spacingPreset.xs,
      marginLeft: responsive.spacingPreset.xs,
    },
    orderNumber: {
      fontWeight: 'bold',
      fontSize: responsive.isWeb ? 24 : responsive.isTablet ? 18 : 20,
      lineHeight: responsive.isWeb ? 32 : responsive.isTablet ? 24 : 28,
    },
    typeChip: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      paddingVertical: responsive.isWeb ? 6 : 4,
      minHeight: responsive.isWeb ? 36 : 28,
      borderRadius: theme.roundness / 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
      marginBottom: responsive.spacingPreset.xxxs,
    },
    typeChipText: {
      fontSize: responsive.isWeb ? 14 : responsive.isTablet ? 11 : 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: responsive.isTablet ? 16 : 18,
      includeFontPadding: false,
    },
    headerTime: {
      fontWeight: '500',
      fontSize: responsive.isWeb ? 16 : responsive.isTablet ? 12 : 13,
    },
    statusChip: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.xs,
      paddingVertical: responsive.isWeb ? 6 : 4,
      minHeight: responsive.isWeb ? 36 : 28,
      borderRadius: theme.roundness / 2,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
      marginBottom: responsive.spacingPreset.xxxs,
    },
    statusChipText: {
      fontSize: responsive.isWeb ? 15 : responsive.isTablet ? 12 : 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: responsive.isWeb ? 22 : responsive.isTablet ? 18 : 20,
      includeFontPadding: false,
    },
    whatsappBadgeContainer: {
      marginTop: 4,
      alignItems: 'flex-start',
    },
    whatsappBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      backgroundColor: '#25D366',
    },
    headerText: {
      color: theme.colors.surface,
    },
    headerSwipeable: {
      paddingHorizontal: responsive.spacingPreset.s,
    },
    headerRightSwipeable: {
      marginLeft: responsive.spacingPreset.xs,
    },
    headerRightNormal: {
      marginLeft: responsive.spacingPreset.m,
    },
    typeChipSwipeable: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginTop: 2,
      marginBottom: 3,
    },
    typeChipNormal: {
      marginTop: 2,
      marginBottom: 3,
    },
    typeChipIcon: {
      marginRight: 4,
    },
    statusChipSwipeable: {
      marginBottom: 2,
    },
    statusChipNormal: {
      marginBottom: 2,
    },
    statusChipWithBorder: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    statusChipWithBorderColor: {
      borderWidth: 1,
    },
  });
