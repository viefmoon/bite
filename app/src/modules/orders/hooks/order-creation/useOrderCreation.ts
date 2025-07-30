import { useState, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useCreateOrderMutation } from '../../hooks/useOrdersQueries';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import type { OrderDetailsForBackend } from '../../utils/orderUtils';

interface UseOrderCreationProps {
  hideCart: () => void;
  resetOrder: () => void;
  isCartEmpty: boolean;
}

export const useOrderCreation = ({
  hideCart,
  resetOrder,
  isCartEmpty,
}: UseOrderCreationProps) => {
  const navigation = useNavigation();
  const createOrderMutation = useCreateOrderMutation();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showExitConfirmationModal, setShowExitConfirmationModal] =
    useState(false);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<
    (() => void) | null
  >(null);
  const isProcessingOrderRef = useRef(false);

  const handleConfirmOrder = async (details: OrderDetailsForBackend) => {
    if (isProcessingOrderRef.current) return;
    isProcessingOrderRef.current = true;
    setIsProcessingOrder(true);

    try {
      const createdOrder = await createOrderMutation.mutateAsync(details);

      showSnackbar({
        message: `Orden #${createdOrder.shiftOrderNumber} creada con éxito`,
        type: 'success',
      });
      hideCart();
      resetOrder();

      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (error) {
      const message = getApiErrorMessage(error as Error);
      showSnackbar({
        message: `Error al crear orden: ${message}`,
        type: 'error',
      });
    } finally {
      setIsProcessingOrder(false);
      isProcessingOrderRef.current = false;
    }
  };

  const handleAttemptExit = (goBackAction: () => void) => {
    if (isCartEmpty) {
      goBackAction();
    } else {
      setPendingNavigationAction(() => goBackAction);
      setShowExitConfirmationModal(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmationModal(false);
    const navigationAction =
      pendingNavigationAction || (() => navigation.goBack());
    setPendingNavigationAction(null);
    navigationAction();
    setTimeout(() => {
      resetOrder();
    }, 100);
  };

  const handleCancelExit = () => {
    setShowExitConfirmationModal(false);
    setPendingNavigationAction(null);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isCartEmpty || showExitConfirmationModal || isProcessingOrder) {
        return;
      }

      e.preventDefault();
      setPendingNavigationAction(
        () => () => navigation.dispatch(e.data.action),
      );
      setShowExitConfirmationModal(true);
    });

    return unsubscribe;
  }, [navigation, isCartEmpty, showExitConfirmationModal, isProcessingOrder]);

  return {
    isProcessingOrder,
    showExitConfirmationModal,
    handleConfirmOrder,
    handleAttemptExit,
    handleConfirmExit,
    handleCancelExit,
  };
};
