import { useRef, useState, useEffect } from 'react';
import { Animated, Vibration, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  KitchenOrder,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';
import { Swipeable } from 'react-native-gesture-handler';
import { useResponsive } from '@/app/hooks/useResponsive';

interface UseOrderCardGesturesProps {
  order: KitchenOrder;
  onStartPreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
  onCompletePreparation?: (orderId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const useOrderCardGestures = ({
  order,
  onStartPreparation,
  onCancelPreparation,
  onCompletePreparation,
  onSwipeStart,
  onSwipeEnd,
}: UseOrderCardGesturesProps) => {
  const responsive = useResponsive();
  const swipeableRef = useRef<Swipeable>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isPressing, setIsPressing] = useState(false);
  const [isSwipeable, setIsSwipeable] = useState(false);

  const swipeActionStyles = StyleSheet.create({
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
  });

  // Determinar qué acciones de swipe están disponibles basado en myScreenStatus
  const getSwipeActions = () => {
    const rightAction = (() => {
      if (order.myScreenStatus === PreparationScreenStatus.PENDING) {
        return {
          type: 'start',
          color: '#FF6B35',
          textColor: '#FFFFFF',
          icon: 'chef-hat',
          text: 'En Preparación',
        };
      }
      return null;
    })();

    const leftAction = (() => {
      if (
        order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION ||
        order.myScreenStatus === PreparationScreenStatus.READY
      ) {
        return {
          type: 'cancel',
          color: '#9C27B0',
          textColor: '#FFFFFF',
          icon: 'arrow-left',
          text: 'Regresar',
        };
      }
      return null;
    })();

    return { rightAction, leftAction };
  };

  const swipeActions = getSwipeActions();

  // Verificar si la orden puede hacer swipe
  useEffect(() => {
    setIsSwipeable(!!swipeActions.rightAction || !!swipeActions.leftAction);
  }, [swipeActions.rightAction, swipeActions.leftAction]);

  // Verificar si la orden puede ser marcada como lista con long press
  const canMarkAsReady = () => {
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCompletePreparation
    );
  };

  // Verificar si la orden puede regresar a en preparación con long press
  const canReturnToInProgress = () => {
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCancelPreparation
    );
  };

  // Manejar el inicio del long press
  const handlePressIn = () => {
    const canComplete = canMarkAsReady();
    const canReturn = canReturnToInProgress();

    if (!canComplete && !canReturn) return;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if ((longPressTimer.current as any).interval) {
        clearInterval((longPressTimer.current as any).interval);
      }
      longPressTimer.current = null;
    }

    animatedValue.stopAnimation();
    animatedValue.setValue(0);

    Vibration.vibrate(10);

    setIsPressing(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    longPressTimer.current = setTimeout(() => {
      Vibration.vibrate([0, 50, 100, 50]);

      if (canComplete && onCompletePreparation) {
        onCompletePreparation(order.id);
      } else if (canReturn && onCancelPreparation) {
        onCancelPreparation(order.id);
      }

      setIsPressing(false);
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, 2000);
  };

  // Manejar cuando se suelta la presión
  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    setIsPressing(false);

    animatedValue.stopAnimation();
    animatedValue.setValue(0);
  };

  // Manejar cuando se completa el swipe hacia la derecha
  const handleRightSwipeComplete = () => {
    if (!swipeActions.rightAction) return;

    switch (swipeActions.rightAction.type) {
      case 'start':
        if (onStartPreparation) onStartPreparation(order.id);
        break;
    }

    swipeableRef.current?.close();
  };

  // Manejar cuando se completa el swipe hacia la izquierda
  const handleLeftSwipeComplete = () => {
    if (!swipeActions.leftAction) return;

    if (swipeActions.leftAction.type === 'cancel') {
      if (onCancelPreparation) onCancelPreparation(order.id);
    }

    swipeableRef.current?.close();
  };

  // Crear las acciones del swipe hacia la derecha
  const getRightActionRenderer = () => {
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
  };

  // Crear las acciones del swipe hacia la izquierda
  const getLeftActionRenderer = () => {
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
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return {
    swipeableRef,
    animatedValue,
    isPressing,
    isSwipeable,
    swipeActions,
    canMarkAsReady: canMarkAsReady(),
    canReturnToInProgress: canReturnToInProgress(),
    renderRightActions: getRightActionRenderer(),
    renderLeftActions: getLeftActionRenderer(),
    handleRightSwipeComplete,
    handleLeftSwipeComplete,
    pressableProps: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      delayLongPress: 0,
    },
    swipeableProps: {
      onSwipeableOpen: () => onSwipeStart && onSwipeStart(),
      onSwipeableClose: () => onSwipeEnd && onSwipeEnd(),
      onSwipeableRightOpen: handleRightSwipeComplete,
      onSwipeableLeftOpen: handleLeftSwipeComplete,
      overshootRight: false,
      overshootLeft: false,
      friction: 1.2,
      rightThreshold: 50,
      leftThreshold: 50,
    },
  };
};
