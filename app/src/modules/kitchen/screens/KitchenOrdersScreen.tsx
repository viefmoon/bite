import { useEffect, useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import {
  useKitchenOrders,
  useStartOrderPreparation,
  useCancelOrderPreparation,
  useCompleteOrderPreparation,
} from '../hooks/useKitchenOrders';
import { useKitchenStore } from '../store/kitchenStore';
import { OrderCard } from '../components/OrderCard';
import { KitchenEmptyState } from '../components/KitchenEmptyState';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useKitchenContext } from '../context/KitchenContext';

export default function KitchenOrdersScreen() {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const { filters } = useKitchenStore();
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const { refetchRef } = useKitchenContext();

  const { data: orders, isLoading, refetch } = useKitchenOrders(filters);
  const startOrderPreparation = useStartOrderPreparation();
  const cancelOrderPreparation = useCancelOrderPreparation();
  const completeOrderPreparation = useCompleteOrderPreparation();

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch, refetchRef]);

  const hasOrders = !!orders?.length;

  const styles = useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

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
  }, [responsive]);

  const handleStartPreparation = useCallback(
    (orderId: string) => {
      startOrderPreparation.mutate(orderId);
    },
    [startOrderPreparation],
  );

  const handleCancelPreparation = useCallback(
    (orderId: string) => {
      cancelOrderPreparation.mutate(orderId);
    },
    [cancelOrderPreparation],
  );

  const handleCompletePreparation = useCallback(
    (orderId: string) => {
      completeOrderPreparation.mutate(orderId);
    },
    [completeOrderPreparation],
  );

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

  const handleSwipeStart = useCallback(() => setIsSwipingCard(true), []);
  const handleSwipeEnd = useCallback(() => {
    setTimeout(() => setIsSwipingCard(false), 100);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando pedidos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasOrders ? (
        <ScrollView
          horizontal={!responsive.isWeb || responsive.width < 1200}
          scrollEnabled={!isSwipingCard}
          showsHorizontalScrollIndicator={false}
          pagingEnabled={false}
          contentContainerStyle={[
            styles.horizontalListContainer,
            responsive.isWeb &&
              responsive.width >= 1200 &&
              styles.gridContainer,
          ]}
          snapToInterval={
            responsive.isWeb
              ? undefined
              : cardWidth + responsive.spacingPreset.m
          }
          decelerationRate="fast"
          snapToAlignment={responsive.isWeb ? undefined : 'start'}
        >
          {orders.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.cardContainer,
                { width: cardWidth },
                index === orders.length - 1
                  ? styles.lastCardContainer
                  : styles.cardContainerWithMargin,
                responsive.isWeb &&
                  responsive.width >= 1200 &&
                  styles.cardContainerWeb,
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
        <KitchenEmptyState filters={filters} />
      )}
    </View>
  );
}

const createStyles = (theme: any, responsive: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    horizontalListContainer: {
      paddingLeft: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.xxs,
      paddingRight: responsive.isWeb
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.xs,
      paddingVertical: responsive.isWeb
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xxs,
      minHeight: '100%',
      alignItems:
        responsive.isWeb && responsive.width >= 1200 ? 'flex-start' : 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingHorizontal: responsive.spacingPreset.l,
      paddingVertical: responsive.spacingPreset.m,
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onBackground,
    },
    cardContainer: {
      height: '100%',
      paddingVertical: responsive.spacingPreset.xxxs,
    },
    cardContainerWeb: {
      marginRight: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.s,
      height: 'auto',
    },
    lastCardContainer: {
      marginRight: 0,
    },
    cardContainerWithMargin: {
      marginRight: responsive.spacingPreset.xxs,
    },
  });
