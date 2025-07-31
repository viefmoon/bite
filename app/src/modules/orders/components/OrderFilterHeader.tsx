import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Surface, Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import {
  OrderOpenList,
  OrderTypeEnum,
  OrderStatusEnum,
} from '../schema/orders.schema';

interface OrderFilterHeaderProps {
  selectedOrderType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum;
  ordersData?: OrderOpenList[];
  onFilterChange: (
    filterType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum,
  ) => void;
}

interface FilterButtonProps {
  filterType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum;
  icon: string;
  isActive: boolean;
  theme: any;
  styles: any;
  count: number;
  onFilterChange: (
    filterType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum,
  ) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  filterType,
  icon,
  isActive,
  theme,
  styles,
  count,
  onFilterChange,
}) => (
  <Pressable
    style={[
      styles.filterButton,
      isActive && styles.filterButtonActive,
      {
        backgroundColor: isActive
          ? theme.colors.primaryContainer
          : theme.colors.surface,
      },
    ]}
    onPress={() => onFilterChange(filterType)}
  >
    <Icon
      source={icon}
      size={26}
      color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
    />
    {count > 0 && (
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: isActive
              ? theme.colors.error
              : theme.colors.errorContainer,
            borderColor: isActive ? theme.colors.error : theme.colors.outline,
          },
        ]}
      >
        <Text
          style={[
            styles.countBadgeText,
            {
              color: isActive
                ? theme.colors.onError
                : theme.colors.onErrorContainer,
            },
          ]}
        >
          {count}
        </Text>
      </View>
    )}
  </Pressable>
);

export const OrderFilterHeader: React.FC<OrderFilterHeaderProps> = ({
  selectedOrderType,
  ordersData,
  onFilterChange,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();

  const styles = useMemo(
    () => ({
      header: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        backgroundColor: 'transparent',
        elevation: 0,
      },
      headerContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 0,
      },
      filterContainer: {
        flex: 1,
        flexDirection: 'row' as const,
        gap: 0,
      },
      filterButton: {
        flex: 1,
        height: responsive.isTablet ? 44 : 52,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderRadius: 0,
        elevation: 1,
        position: 'relative' as const,
      },
      filterButtonActive: {
        elevation: 3,
      },
      countBadge: {
        position: 'absolute' as const,
        top: responsive.isTablet ? 3 : 6,
        right: responsive.isTablet ? 3 : 6,
        minWidth: responsive.isTablet ? 18 : 22,
        height: responsive.isTablet ? 18 : 22,
        borderRadius: responsive.isTablet ? 9 : 11,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        paddingHorizontal: responsive.isTablet ? 4 : 6,
        borderWidth: 1,
        elevation: 2,
      },
      countBadgeText: {
        fontSize: responsive.isTablet ? 10 : 12,
        fontWeight: '700' as const,
      },
    }),
    [responsive],
  );

  const getFilterCount = (
    filterType: 'ALL' | 'WHATSAPP' | keyof typeof OrderTypeEnum,
  ): number => {
    if (!ordersData) return 0;

    if (filterType === 'ALL') {
      return ordersData.filter(
        (o) => !(o.isFromWhatsApp && o.orderStatus === OrderStatusEnum.PENDING),
      ).length;
    }

    if (filterType === 'WHATSAPP') {
      return ordersData.filter(
        (o) => o.isFromWhatsApp && o.orderStatus === OrderStatusEnum.PENDING,
      ).length;
    }

    return ordersData.filter(
      (o) =>
        o.orderType === filterType &&
        !(o.isFromWhatsApp && o.orderStatus === OrderStatusEnum.PENDING),
    ).length;
  };

  return (
    <Surface style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.filterContainer}>
          <FilterButton
            filterType="ALL"
            icon="view-grid"
            isActive={selectedOrderType === 'ALL'}
            theme={theme}
            styles={styles}
            count={getFilterCount('ALL')}
            onFilterChange={onFilterChange}
          />
          <FilterButton
            filterType={OrderTypeEnum.DINE_IN}
            icon="silverware-fork-knife"
            isActive={selectedOrderType === OrderTypeEnum.DINE_IN}
            theme={theme}
            styles={styles}
            count={getFilterCount(OrderTypeEnum.DINE_IN)}
            onFilterChange={onFilterChange}
          />
          <FilterButton
            filterType={OrderTypeEnum.TAKE_AWAY}
            icon="bag-personal"
            isActive={selectedOrderType === OrderTypeEnum.TAKE_AWAY}
            theme={theme}
            styles={styles}
            count={getFilterCount(OrderTypeEnum.TAKE_AWAY)}
            onFilterChange={onFilterChange}
          />
          <FilterButton
            filterType={OrderTypeEnum.DELIVERY}
            icon="moped"
            isActive={selectedOrderType === OrderTypeEnum.DELIVERY}
            theme={theme}
            styles={styles}
            count={getFilterCount(OrderTypeEnum.DELIVERY)}
            onFilterChange={onFilterChange}
          />
          <FilterButton
            filterType="WHATSAPP"
            icon="whatsapp"
            isActive={selectedOrderType === 'WHATSAPP'}
            theme={theme}
            styles={styles}
            count={getFilterCount('WHATSAPP')}
            onFilterChange={onFilterChange}
          />
        </View>
      </View>
    </Surface>
  );
};
