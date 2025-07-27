import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Icon, Surface, Checkbox } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { ConnectionIndicator } from '@/app/components/ConnectionIndicator';
import { KitchenFilterButton } from '@/modules/kitchen/components/KitchenFilterButton';
import { RefreshButton } from '@/modules/kitchen/components/RefreshButton';
import { useAuthStore } from '@/app/store/authStore';
import { useKitchenStore } from '@/modules/kitchen/store/kitchenStore';
import { OrderTypeEnum } from '@/modules/kitchen/schema/kitchen.schema';

interface KitchenHeaderProps {
  onMenuPress: () => void;
}

export const useKitchenHeader = ({ onMenuPress }: KitchenHeaderProps) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const user = useAuthStore((state) => state.user);
  const { filters, setFilters } = useKitchenStore();
  const screenName = user?.preparationScreen?.name || 'Pantalla de Preparación';

  const getFilterText = () => {
    switch (filters.orderType) {
      case OrderTypeEnum.DINE_IN:
        return ' • Mesa';
      case OrderTypeEnum.TAKE_AWAY:
        return ' • Llevar';
      case OrderTypeEnum.DELIVERY:
        return ' • Domicilio';
      default:
        return '';
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        drawerButtonContainer: {
          width: 56,
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 0,
          borderRadius: 28,
        },
        titleContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerTitleStyle: {
          ...theme.fonts.titleLarge,
          color: theme.colors.onPrimary,
          fontWeight: 'bold',
          fontSize: responsive.isWeb ? 26 : responsive.isTablet ? 20 : 22,
        },
        filterIndicator: {
          ...theme.fonts.titleMedium,
          fontWeight: '500',
          opacity: 0.9,
          color: theme.colors.onPrimary,
        },
        transparentSurface: {
          backgroundColor: 'transparent',
        },
        headerRightContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        preparedOrdersToggle: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginRight: 8,
          borderRadius: 20,
        },
        preparedOrdersText: {
          marginLeft: 4,
          color: theme.colors.onPrimary,
        },
        preparedOrdersToggleActive: {
          backgroundColor: 'rgba(255,255,255,0.2)',
        },
        preparedOrdersToggleInactive: {
          backgroundColor: 'transparent',
        },
        preparedOrdersTextWeb: {
          fontSize: 16,
        },
        preparedOrdersTextMobile: {
          fontSize: 14,
        },
        preparedOrdersTextBold: {
          fontWeight: 'bold',
        },
        preparedOrdersTextNormal: {
          fontWeight: 'normal',
        },
      }),
    [theme, responsive],
  );

  const MenuButton = () => (
    <TouchableOpacity
      style={styles.drawerButtonContainer}
      onPress={onMenuPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon
        source="menu"
        size={responsive.isWeb ? 36 : 32}
        color={theme.colors.onPrimary}
      />
    </TouchableOpacity>
  );

  const Title = () => (
    <Surface elevation={0} style={styles.transparentSurface}>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitleStyle}>{screenName}</Text>
        {filters.orderType && (
          <Text style={styles.filterIndicator}>{getFilterText()}</Text>
        )}
      </View>
    </Surface>
  );

  const RightActions = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={[
          styles.preparedOrdersToggle,
          filters.showPrepared
            ? styles.preparedOrdersToggleActive
            : styles.preparedOrdersToggleInactive,
        ]}
        onPress={() =>
          setFilters({
            ...filters,
            showPrepared: !filters.showPrepared,
          })
        }
      >
        <Checkbox
          status={filters.showPrepared ? 'checked' : 'unchecked'}
          onPress={() =>
            setFilters({
              ...filters,
              showPrepared: !filters.showPrepared,
            })
          }
          color={theme.colors.onPrimary}
          uncheckedColor={theme.colors.onPrimary}
        />
        <Text
          style={[
            styles.preparedOrdersText,
            responsive.isWeb
              ? styles.preparedOrdersTextWeb
              : styles.preparedOrdersTextMobile,
            filters.showPrepared
              ? styles.preparedOrdersTextBold
              : styles.preparedOrdersTextNormal,
          ]}
        >
          Mostrar Listas
        </Text>
      </TouchableOpacity>
      <KitchenFilterButton />
      <RefreshButton />
      <ConnectionIndicator />
    </View>
  );

  return {
    MenuButton,
    Title,
    RightActions,
    screenName,
    styles,
  };
};