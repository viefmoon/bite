import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import {
  Text,
  FAB,
  ActivityIndicator,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useOrientation } from '@/hooks/useOrientation';
import {
  useKitchenOrders,
  useStartOrderPreparation,
  useCancelOrderPreparation,
  useCompleteOrderPreparation,
} from '../hooks/useKitchenOrders';
import { useKitchenStore } from '../store/kitchenStore';
import { OrderCard } from '../components/OrderCard';
import * as ScreenOrientation from 'expo-screen-orientation';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '@/app/hooks/useResponsive';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKitchenContext } from '../context/KitchenContext';
import { OrderType } from '../types/kitchen.types';

export default function KitchenOrdersScreen({ navigation }: any) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const isLandscape = useOrientation();
  const { filters, setFilters } = useKitchenStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const flatListRef = useRef<ScrollView>(null);
  const { refetchRef } = useKitchenContext();

  const {
    data: orders,
    isLoading,
    refetch,
    isRefetching,
  } = useKitchenOrders(filters);
  const startOrderPreparation = useStartOrderPreparation();
  const cancelOrderPreparation = useCancelOrderPreparation();
  const completeOrderPreparation = useCompleteOrderPreparation();

  // Conectar la función de refetch al contexto
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch, refetchRef]);

  // Crear estilos responsive
  const styles = createStyles(theme, responsive);

  // Forzar orientación horizontal para pantallas de preparación
  useEffect(() => {
    const setLandscape = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE,
      );
    };
    setLandscape();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // El drawer está desactivado globalmente en KitchenOnlyNavigator

  // Animación de pulso para el icono vacío
  useEffect(() => {
    const hasOrders = orders && orders.length > 0;
    if (!hasOrders) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [orders, pulseAnim]);

  const handleStartPreparation = (orderId: string) => {
    startOrderPreparation.mutate(orderId);
  };

  const handleCancelPreparation = (orderId: string) => {
    cancelOrderPreparation.mutate(orderId);
  };

  const handleCompletePreparation = (orderId: string) => {
    completeOrderPreparation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
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

  const hasOrders = orders && orders.length > 0;

  // Calcular ancho de las tarjetas para lista horizontal
  const cardWidth = responsive.isTablet
    ? responsive.getResponsiveDimension(280, 320)
    : responsive.getResponsiveDimension(240, 280);

  // Generar mensaje contextual según filtros activos
  const getEmptyMessage = () => {
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
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {hasOrders ? (
          <ScrollView
            ref={flatListRef}
            horizontal
            scrollEnabled={!isSwipingCard}
            showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            contentContainerStyle={styles.horizontalListContainer}
          >
            {orders.map((item, index) => (
              <View
                key={item.id}
                style={{
                  width: cardWidth,
                  marginRight:
                    index === orders.length - 1 ? 0 : responsive.spacing.xxs,
                  height: '100%',
                  paddingVertical: responsive.spacing.xxxs,
                }}
              >
                <OrderCard
                  order={item}
                  onStartPreparation={handleStartPreparation}
                  onCancelPreparation={handleCancelPreparation}
                  onCompletePreparation={handleCompletePreparation}
                  onSwipeStart={() => {
                    setIsSwipingCard(true);
                  }}
                  onSwipeEnd={() => {
                    setTimeout(() => {
                      setIsSwipingCard(false);
                    }, 100);
                  }}
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.emptyStateContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Surface
              style={[
                styles.emptyCard,
                { backgroundColor: theme.colors.surface },
              ]}
              elevation={2}
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
                  size={responsive.getResponsiveDimension(24, 32)}
                  color={theme.colors.onSurfaceVariant}
                />
              </Animated.View>
              <Text
                variant="titleMedium"
                style={[styles.emptyText, { color: theme.colors.onSurface }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {getEmptyMessage().title}
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
                {getEmptyMessage().subtitle}
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
                {getEmptyMessage().hint}
              </Text>
            </Surface>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

// Mover estilos antes del componente para usar responsive
const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ordersContainer: {
      paddingHorizontal: responsive.spacing.m,
      paddingTop: responsive.spacing.s,
      paddingBottom: responsive.spacing.m,
      gap: responsive.spacing.s,
    },
    gridContainer: {
      flex: 1,
      padding: responsive.spacing.m,
    },
    horizontalListContainer: {
      paddingLeft: responsive.spacing.xxs,
      paddingRight: responsive.spacing.xs,
      paddingVertical: responsive.spacing.xxs,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.m,
      paddingVertical: responsive.spacing.xs,
    },
    emptyCard: {
      paddingHorizontal: responsive.spacing.m,
      paddingVertical: responsive.spacing.xs,
      borderRadius: theme.roundness * 2,
      alignItems: 'center',
      maxHeight: '85%',
      width: responsive.getResponsiveDimension(300, 400),
      opacity: 0.9,
    },
    emptyIconContainer: {
      marginBottom: responsive.spacing.xs,
      opacity: 0.5,
      padding: responsive.spacing.xs,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    emptyText: {
      textAlign: 'center',
      marginBottom: responsive.spacing.xxs,
      fontWeight: '600',
      fontSize: responsive.fontSize.s,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
    },
    emptySubtext: {
      textAlign: 'center',
      lineHeight: responsive.getResponsiveDimension(16, 18),
      opacity: 0.7,
      marginBottom: responsive.spacing.xs,
      fontSize: responsive.fontSize.xs,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
    },
    emptyHint: {
      textAlign: 'center',
      opacity: 0.5,
      fontStyle: 'italic',
      fontSize: responsive.fontSize.xxs,
      paddingHorizontal: responsive.spacing.xs,
      maxWidth: '100%',
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingTop: responsive.spacing.xs,
      marginTop: responsive.spacing.xxs,
      width: '90%',
    },
  });
