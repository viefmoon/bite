import { useRef } from 'react';
import { KitchenOrder } from '../schema/kitchen.schema';
import { Swipeable } from 'react-native-gesture-handler';
import { useSwipeActions } from './useSwipeActions';
import { useLongPressAction } from './useLongPressAction';

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
  const swipeableRef = useRef<Swipeable>(null);

  // Usar los hooks especializados
  const swipeActions = useSwipeActions({
    order,
    onStartPreparation,
    onCancelPreparation,
  });

  const longPressAction = useLongPressAction({
    order,
    onCompletePreparation,
    onCancelPreparation,
  });

  // Manejar cuando se completa el swipe con cierre automático
  const handleRightSwipeComplete = () => {
    swipeActions.handleRightSwipeComplete();
    swipeableRef.current?.close();
  };

  const handleLeftSwipeComplete = () => {
    swipeActions.handleLeftSwipeComplete();
    swipeableRef.current?.close();
  };

  return {
    swipeableRef,
    animatedValue: longPressAction.animatedValue,
    isPressing: longPressAction.isPressing,
    isSwipeable: swipeActions.isSwipeable,
    canMarkAsReady: longPressAction.canMarkAsReady,
    canReturnToInProgress: longPressAction.canReturnToInProgress,
    renderRightActions: swipeActions.renderRightActions,
    renderLeftActions: swipeActions.renderLeftActions,
    pressableProps: longPressAction.pressableProps,
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
