import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated, Vibration } from 'react-native';
import {
  KitchenOrder,
  PreparationScreenStatus,
} from '../schema/kitchen.schema';

interface UseLongPressActionProps {
  order: KitchenOrder;
  onCompletePreparation?: (orderId: string) => void;
  onCancelPreparation?: (orderId: string) => void;
}

export const useLongPressAction = ({
  order,
  onCompletePreparation,
  onCancelPreparation,
}: UseLongPressActionProps) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isPressing, setIsPressing] = useState(false);

  const canMarkAsReady = useCallback(() => {
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCompletePreparation
    );
  }, [order.myScreenStatus, onCompletePreparation]);

  const canReturnToInProgress = useCallback(() => {
    return (
      order.myScreenStatus === PreparationScreenStatus.IN_PREPARATION &&
      onCancelPreparation
    );
  }, [order.myScreenStatus, onCancelPreparation]);

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      if ((longPressTimer.current as any).interval) {
        clearInterval((longPressTimer.current as any).interval);
      }
      longPressTimer.current = null;
    }
  }, []);

  const resetAnimation = useCallback(() => {
    animatedValue.stopAnimation();
    animatedValue.setValue(0);
  }, [animatedValue]);

  const handlePressIn = useCallback(() => {
    const canComplete = canMarkAsReady();
    const canReturn = canReturnToInProgress();

    if (!canComplete && !canReturn) return;

    clearTimer();
    resetAnimation();

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
  }, [
    canMarkAsReady,
    canReturnToInProgress,
    clearTimer,
    resetAnimation,
    animatedValue,
    onCompletePreparation,
    onCancelPreparation,
    order.id,
  ]);

  const handlePressOut = useCallback(() => {
    clearTimer();
    setIsPressing(false);
    resetAnimation();
  }, [clearTimer, resetAnimation]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    animatedValue,
    isPressing,
    canMarkAsReady: canMarkAsReady(),
    canReturnToInProgress: canReturnToInProgress(),
    pressableProps: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      delayLongPress: 0,
    },
  };
};
