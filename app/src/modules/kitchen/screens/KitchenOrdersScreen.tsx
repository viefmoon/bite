import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import {
  useKitchenOrders,
  useStartOrderPreparation,
  useCancelOrderPreparation,
  useCompleteOrderPreparation,
} from '../hooks/useKitchenOrdersEfficient';
import { useKitchenStore } from '../store/kitchenStore';
import { OrderCard } from '../components/OrderCard';
import * as ScreenOrientation from 'expo-screen-orientation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useKitchenContext } from '../context/KitchenContext';
import { OrderType } from '../types/kitchen.types';

export default function KitchenOrdersScreen() {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { filters } = useKitchenStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const { refetchRef } = useKitchenContext();

  const {
    data: orders,
    isLoading,
    refetch,
  } = useKitchenOrders(filters);
  const startOrderPreparation = useStartOrderPreparation();
  const cancelOrderPreparation = useCancelOrderPreparation();
  const completeOrderPreparation = useCompleteOrderPreparation();

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch, refetchRef]);

  const hasOrders = !!orders?.length;

  const styles = useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  
  const cardWidth = useMemo(() => {
    if (responsive.isDesktop) {
      // En desktop, las tarjetas son más grandes
      return responsive.getResponsiveDimension(340, 380);
    }
    if (responsive.isWeb && responsive.isTablet) {
      // En web tablet, tamaño intermedio
      return responsive.getResponsiveDimension(300, 340);
    }
    return responsive.isTablet
      ? responsive.getResponsiveDimension(280, 320)
      : responsive.getResponsiveDimension(240, 280);
  }, [responsive.isTablet, responsive.isDesktop, responsive.isWeb]);

  const handleStartPreparation = useCallback((orderId: string) => {
    startOrderPreparation.mutate(orderId);
  }, [startOrderPreparation]);

  const handleCancelPreparation = useCallback((orderId: string) => {
    cancelOrderPreparation.mutate(orderId);
  }, [cancelOrderPreparation]);

  const handleCompletePreparation = useCallback((orderId: string) => {
    completeOrderPreparation.mutate(orderId);
  }, [completeOrderPreparation]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const setLandscape = async () => {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      };
      setLandscape();

      return () => {
        ScreenOrientation.unlockAsync();
      };
    }
  }, []);

  useEffect(() => {
    if (!hasOrders) {
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
    }
  }, [hasOrders, pulseAnim]);

  const emptyMessage = useMemo(() => {
    const activeFilters = [];

    if (filters.orderType) {
      const typeLabels = {
        [OrderType.DINE_IN]: 'Para Mesa',
        [OrderType.TAKE_AWAY]: 'Para Llevar',
        [OrderType.DELIVERY]: 'Delivery',
      };
      activeFilters.push(`Tipo: ${typeLabels[filters.orderType]}`);
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

  const handleSwipeStart = useCallback(() => setIsSwipingCard(true), []);
  const handleSwipeEnd = useCallback(() => {
    setTimeout(() => setIsSwipingCard(false), 100);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          variant="bodyLarge"
          style={{
            marginTop: theme.spacing.m,
            color: theme.colors.onBackground,
          }}
        >
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {hasOrders ? (
          <ScrollView
            horizontal={!responsive.isWeb || responsive.width < 1200}
            scrollEnabled={!isSwipingCard}
            showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            contentContainerStyle={[
              styles.horizontalListContainer,
              responsive.isWeb && responsive.width >= 1200 && styles.gridContainer
            ]}
            snapToInterval={responsive.isWeb ? undefined : cardWidth + responsive.spacing.m}
            decelerationRate="fast"
            snapToAlignment={responsive.isWeb ? undefined : "start"}
          >
            {orders.map((item, index) => (
              <View
                key={item.id}
                style={[
                  {
                    width: cardWidth,
                    marginRight:
                      index === orders.length - 1 ? 0 : responsive.spacing.xxs,
                    height: '100%',
                    paddingVertical: responsive.spacing.xxxs,
                  },
                  responsive.isWeb && responsive.width >= 1200 && {
                    marginRight: responsive.spacing.s,
                    marginBottom: responsive.spacing.s,
                    height: 'auto',
                  }
                ]}
              >
                <OrderCard
                  order={item}
                  onStartPreparation={handleStartPreparation}
                  onCancelPreparation={handleCancelPreparation}
                  onCompletePreparation={handleCompletePreparation}
                  onSwipeStart={handleSwipeStart}
                  onSwipeEnd={handleSwipeEnd}
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View
            style={styles.emptyStateContainer}
          >
            <Surface
              style={styles.emptyCard}
              elevation={4}
            >
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
                  size={responsive.isWeb ? 64 : responsive.getResponsiveDimension(32, 40)}
                  color={theme.colors.primary}
                />
              </Animated.View>
              <Text
                variant="titleMedium"
                style={[styles.emptyText, { color: theme.colors.onSurface }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {emptyMessage.title}
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.emptySubtext,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {emptyMessage.subtitle}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.emptyHint,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {emptyMessage.hint}
              </Text>
            </Surface>
          </View>
        )}
    </View>
  );
}

const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    horizontalListContainer: {
      paddingLeft: responsive.isWeb ? responsive.spacing.m : responsive.spacing.xxs,
      paddingRight: responsive.isWeb ? responsive.spacing.m : responsive.spacing.xs,
      paddingVertical: responsive.isWeb ? responsive.spacing.s : responsive.spacing.xxs,
      minHeight: '100%',
      alignItems: responsive.isWeb && responsive.width >= 1200 ? 'flex-start' : 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingHorizontal: responsive.spacing.l,
      paddingVertical: responsive.spacing.m,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.m,
      paddingVertical: responsive.spacing.xs,
      backgroundColor: theme.colors.background,
    },
    emptyCard: {
      paddingHorizontal: responsive.isWeb ? responsive.spacing.xl : responsive.spacing.m,
      paddingVertical: responsive.isWeb ? responsive.spacing.xl : responsive.spacing.m,
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
      marginBottom: responsive.spacing.s,
      padding: responsive.spacing.s,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.roundness,
    },
    emptyText: {
      textAlign: 'center',
      marginBottom: responsive.spacing.xs,
      fontWeight: '600',
      fontSize: responsive.fontSize.s,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
      color: theme.colors.onSurface,
    },
    emptySubtext: {
      textAlign: 'center',
      lineHeight: responsive.getResponsiveDimension(16, 18),
      opacity: 0.7,
      marginBottom: responsive.spacing.s,
      fontSize: responsive.fontSize.xs,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
    emptyHint: {
      textAlign: 'center',
      opacity: 0.5,
      fontStyle: 'italic',
      fontSize: responsive.fontSize.xs - 1,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: responsive.spacing.s,
      marginTop: responsive.spacing.xs,
      width: '80%',
      fontWeight: '400',
      color: theme.colors.onSurfaceVariant,
    },
  });
