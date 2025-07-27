import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import {
  KitchenOrder,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';
import { useResponsive } from '@/app/hooks/useResponsive';
import { Swipeable } from 'react-native-gesture-handler';
import { OrderHistoryModal } from '@/modules/shared/components/OrderHistoryModal';
import { useMarkItemPrepared } from '../hooks/useKitchenOrders';
import { useOrderCardGestures } from '../hooks/useOrderCardGestures';
import { OrderCardHeader } from './OrderCardHeader';
import { OrderCardDetails } from './OrderCardDetails';
import { OrderCardItems } from './OrderCardItems';
import { OrderCardActions } from './OrderCardActions';

interface OrderCardProps {
  order: KitchenOrder;
  onStartPreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
  onCompletePreparation?: (orderId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStartPreparation,
  onCancelPreparation,
  onCompletePreparation,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = createStyles(responsive, theme);
  const [showHistory, setShowHistory] = useState(false);
  const markItemPrepared = useMarkItemPrepared();

  const {
    swipeableRef,
    animatedValue,
    isPressing,
    isSwipeable,
    canMarkAsReady,
    canReturnToInProgress,
    renderRightActions,
    renderLeftActions,
    pressableProps,
    swipeableProps,
  } = useOrderCardGestures({
    order,
    onStartPreparation,
    onCancelPreparation,
    onCompletePreparation,
    onSwipeStart,
    onSwipeEnd,
  });

  // Verificar si mi pantalla está en preparación
  const isOrderInPreparation =
    order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION;

  const handleToggleItemPrepared = useCallback(
    (itemId: string, currentStatus: boolean) => {
      markItemPrepared.mutate({
        itemId,
        isPrepared: !currentStatus,
      });
    },
    [markItemPrepared],
  );

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.cardContent}>
        {isSwipeable ? (
          <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions || undefined}
            renderLeftActions={renderLeftActions || undefined}
            {...swipeableProps}
          >
            <Pressable {...pressableProps}>
              <OrderCardHeader order={order} isSwipeable={isSwipeable} />
              {isPressing && (canMarkAsReady || canReturnToInProgress) && (
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      canMarkAsReady
                        ? styles.progressBarReady
                        : styles.progressBarInProgress,
                      {
                        width: animatedValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          </Swipeable>
        ) : (
          <OrderCardHeader order={order} isSwipeable={isSwipeable} />
        )}

        <OrderCardDetails order={order} />
        <OrderCardItems
          order={order}
          onToggleItemPrepared={handleToggleItemPrepared}
          isOrderInPreparation={isOrderInPreparation}
        />
        <OrderCardActions onShowHistory={() => setShowHistory(true)} />
      </View>

      <OrderHistoryModal
        visible={showHistory}
        onDismiss={() => setShowHistory(false)}
        orderId={order.id}
        orderNumber={order.shiftOrderNumber}
      />
    </Surface>
  );
};

const createStyles = (responsive: any, theme: any) =>
  StyleSheet.create({
    card: {
      width: '100%',
      height: '100%',
      maxHeight:
        responsive.height -
        responsive.dimensions.headerHeight -
        responsive.spacingPreset.s,
      borderRadius: theme.roundness / 2,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    },
    progressBarContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
    },
    progressBarReady: {
      backgroundColor: theme.colors.success,
    },
    progressBarInProgress: {
      backgroundColor: '#FF6B35',
    },
  });
