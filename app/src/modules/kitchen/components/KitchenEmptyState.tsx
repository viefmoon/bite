import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { OrderTypeEnum } from '../schema/kitchen.schema';

interface KitchenEmptyStateProps {
  filters: {
    orderType?: keyof typeof OrderTypeEnum;
    showPrepared?: boolean;
    showAllProducts?: boolean;
    screenId?: string;
  };
}

export const KitchenEmptyState: React.FC<KitchenEmptyStateProps> = ({
  filters,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const emptyMessage = useMemo(() => {
    const activeFilters = [];

    if (filters.orderType) {
      const typeLabels: Record<string, string> = {
        [OrderTypeEnum.DINE_IN]: 'Para Mesa',
        [OrderTypeEnum.TAKE_AWAY]: 'Para Llevar',
        [OrderTypeEnum.DELIVERY]: 'Delivery',
      };
      activeFilters.push(
        `Tipo: ${typeLabels[filters.orderType] || 'Desconocido'}`,
      );
    }

    if (filters.showPrepared) {
      activeFilters.push('Solo órdenes listas');
    }

    if (!filters.showAllProducts && filters.screenId) {
      activeFilters.push('Solo productos de esta pantalla');
    }

    if (activeFilters.length > 0) {
      return {
        title: 'No hay pedidos con los filtros activos',
        subtitle: `Filtros: ${activeFilters.join(', ')}`,
        hint: 'Ajusta los filtros o espera nuevos pedidos',
      };
    }

    return {
      title: 'No hay pedidos pendientes',
      subtitle: 'Los nuevos pedidos aparecerán aquí automáticamente',
      hint: 'Presiona el botón de recargar para verificar nuevos pedidos',
    };
  }, [filters]);

  return (
    <View style={styles.emptyStateContainer}>
      <Surface style={styles.emptyCard} elevation={4}>
        <Animated.View
          style={[
            styles.emptyIconContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Icon
            name={
              filters.orderType ||
              filters.showPrepared ||
              !filters.showAllProducts
                ? 'filter-remove'
                : 'chef-hat'
            }
            size={
              responsive.isWeb ? 64 : responsive.getResponsiveDimension(32, 40)
            }
            color={theme.colors.primary}
          />
        </Animated.View>
        <Text
          variant="titleMedium"
          style={styles.emptyText}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {emptyMessage.title}
        </Text>
        <Text
          variant="bodyMedium"
          style={styles.emptySubtext}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {emptyMessage.subtitle}
        </Text>
        <Text
          variant="bodySmall"
          style={styles.emptyHint}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {emptyMessage.hint}
        </Text>
      </Surface>
    </View>
  );
};

const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.spacingPreset.m,
      paddingVertical: responsive.spacingPreset.xs,
      backgroundColor: theme.colors.background,
    },
    emptyCard: {
      paddingHorizontal: responsive.isWeb
        ? responsive.spacingPreset.xl
        : responsive.spacingPreset.m,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.xl
        : responsive.spacingPreset.m,
      borderRadius: theme.roundness * 2,
      alignItems: 'center',
      maxHeight: '70%',
      width: responsive.isWeb
        ? responsive.getResponsiveDimension(400, 480)
        : responsive.getResponsiveDimension(280, 320),
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    emptyIconContainer: {
      marginBottom: responsive.spacingPreset.s,
      padding: responsive.spacingPreset.s,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.roundness,
    },
    emptyText: {
      textAlign: 'center',
      marginBottom: responsive.spacingPreset.xs,
      fontWeight: '600',
      fontSize: responsive.fontSizePreset.s,
      paddingHorizontal: responsive.spacingPreset.xs,
      maxWidth: '100%',
      color: theme.colors.onSurface,
    },
    emptySubtext: {
      textAlign: 'center',
      lineHeight: responsive.getResponsiveDimension(16, 18),
      opacity: 0.7,
      marginBottom: responsive.spacingPreset.s,
      fontSize: responsive.fontSizePreset.xs,
      paddingHorizontal: responsive.spacingPreset.xs,
      maxWidth: '100%',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    emptyHint: {
      textAlign: 'center',
      opacity: 0.5,
      fontStyle: 'italic',
      fontSize: responsive.fontSizePreset.xs - 1,
      paddingHorizontal: responsive.spacingPreset.xs,
      maxWidth: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: responsive.spacingPreset.s,
      marginTop: responsive.spacingPreset.xs,
      width: '80%',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
  });
