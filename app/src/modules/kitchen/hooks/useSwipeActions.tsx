import { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  KitchenOrder,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useAppTheme } from '@/app/styles/theme';

interface SwipeAction {
  type: 'start' | 'cancel';
  color: string;
  textColor: string;
  icon: string;
  text: string;
}

interface UseSwipeActionsProps {
  order: KitchenOrder;
  onStartPreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
}

export const useSwipeActions = ({
  order,
  onStartPreparation,
  onCancelPreparation,
}: UseSwipeActionsProps) => {
  const responsive = useResponsive();
  const theme = useAppTheme();

  const swipeActionStyles = useMemo(
    () =>
      StyleSheet.create({
        swipeAction: {
          width: 120,
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: responsive.spacingPreset.xs,
          paddingHorizontal: responsive.spacingPreset.s,
        },
        swipeText: {
          fontWeight: 'bold',
          fontSize: responsive.fontSizePreset.s,
        },
      }),
    [responsive],
  );

  const swipeActions = useMemo(() => {
    const rightAction: SwipeAction | null = (() => {
      if (order.myScreenStatus === PreparationScreenStatus.PENDING) {
        return {
          type: 'start',
          color: theme.colors.warning || '#FF6B35',
          textColor: theme.colors.onPrimary,
          icon: 'chef-hat',
          text: 'En Preparación',
        };
      }
      return null;
    })();

    const leftAction: SwipeAction | null = (() => {
      if (
        order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION ||
        order.myScreenStatus === PreparationScreenStatus.READY
      ) {
        return {
          type: 'cancel',
          color: theme.colors.secondary,
          textColor: theme.colors.onSecondary,
          icon: 'arrow-left',
          text: 'Regresar',
        };
      }
      return null;
    })();

    return { rightAction, leftAction };
  }, [order.myScreenStatus, theme.colors]);

  const isSwipeable = useMemo(
    () => !!swipeActions.rightAction || !!swipeActions.leftAction,
    [swipeActions.rightAction, swipeActions.leftAction],
  );

  const handleRightSwipeComplete = useCallback(() => {
    if (!swipeActions.rightAction) return;

    switch (swipeActions.rightAction.type) {
      case 'start':
        if (onStartPreparation) onStartPreparation(order.id);
        break;
    }
  }, [swipeActions.rightAction, onStartPreparation, order.id]);

  const handleLeftSwipeComplete = useCallback(() => {
    if (!swipeActions.leftAction) return;

    if (swipeActions.leftAction.type === 'cancel') {
      if (onCancelPreparation) onCancelPreparation(order.id);
    }
  }, [swipeActions.leftAction, onCancelPreparation, order.id]);

  const getRightActionRenderer = useCallback(() => {
    if (!swipeActions.rightAction) return null;

    return () => (
      <View
        style={[
          swipeActionStyles.swipeAction,
          { backgroundColor: swipeActions.rightAction!.color },
        ]}
      >
        <Icon
          name={swipeActions.rightAction!.icon as any}
          size={24}
          color={swipeActions.rightAction!.textColor}
        />
        <Text
          style={[
            swipeActionStyles.swipeText,
            { color: swipeActions.rightAction!.textColor },
          ]}
        >
          {swipeActions.rightAction!.text}
        </Text>
      </View>
    );
  }, [swipeActions.rightAction, swipeActionStyles]);

  const getLeftActionRenderer = useCallback(() => {
    if (!swipeActions.leftAction) return null;

    return () => (
      <View
        style={[
          swipeActionStyles.swipeAction,
          { backgroundColor: swipeActions.leftAction!.color },
        ]}
      >
        <Text
          style={[
            swipeActionStyles.swipeText,
            { color: swipeActions.leftAction!.textColor },
          ]}
        >
          {swipeActions.leftAction!.text}
        </Text>
        <Icon
          name={swipeActions.leftAction!.icon as any}
          size={24}
          color={swipeActions.leftAction!.textColor}
        />
      </View>
    );
  }, [swipeActions.leftAction, swipeActionStyles]);

  return {
    swipeActions,
    isSwipeable,
    renderRightActions: getRightActionRenderer(),
    renderLeftActions: getLeftActionRenderer(),
    handleRightSwipeComplete,
    handleLeftSwipeComplete,
  };
};
