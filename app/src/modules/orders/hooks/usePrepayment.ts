import { useState, useCallback } from 'react';
import { prepaymentService } from '@/modules/payments/services/prepaymentService';
import { useSnackbarStore } from '@/app/stores/snackbarStore';

interface UsePrepaymentProps {
  initialPrepaymentId?: string | null;
  initialPaymentAmount?: string;
  initialPaymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | null;
}

interface UsePrepaymentReturn {
  prepaymentId: string | null;
  paymentAmount: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  showPrepaymentModal: boolean;
  showDeletePrepaymentConfirm: boolean;
  setPrepaymentId: (id: string | null) => void;
  setPaymentAmount: (amount: string) => void;
  setPaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | null) => void;
  setShowPrepaymentModal: (show: boolean) => void;
  setShowDeletePrepaymentConfirm: (show: boolean) => void;
  handlePrepaymentCreated: (
    prepaymentIdCreated: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER',
  ) => void;
  handleDeletePrepayment: () => void;
  confirmDeletePrepayment: () => Promise<void>;
  handlePrepaymentDeleted: () => void;
}

export const usePrepayment = ({
  initialPrepaymentId = null,
  initialPaymentAmount = '',
  initialPaymentMethod = 'CASH',
}: UsePrepaymentProps = {}): UsePrepaymentReturn => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [prepaymentId, setPrepaymentId] = useState<string | null>(
    initialPrepaymentId,
  );
  const [paymentAmount, setPaymentAmount] = useState(initialPaymentAmount);
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD' | 'TRANSFER' | null
  >(initialPaymentMethod);
  const [showPrepaymentModal, setShowPrepaymentModal] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] =
    useState(false);

  const handlePrepaymentCreated = useCallback(
    (
      prepaymentIdCreated: string,
      amount: number,
      method: 'CASH' | 'CARD' | 'TRANSFER',
    ) => {
      const isUpdate = prepaymentId === prepaymentIdCreated;
      setPrepaymentId(prepaymentIdCreated);
      setPaymentAmount(amount.toFixed(2));
      setPaymentMethod(method);
      setShowPrepaymentModal(false);

      showSnackbar({
        message: isUpdate
          ? 'Pago actualizado correctamente'
          : 'Pago registrado correctamente',
        type: 'success',
      });
    },
    [prepaymentId, showSnackbar],
  );

  const handleDeletePrepayment = useCallback(() => {
    if (!prepaymentId) return;
    setShowDeletePrepaymentConfirm(true);
  }, [prepaymentId]);

  const confirmDeletePrepayment = useCallback(async () => {
    if (!prepaymentId) return;

    try {
      await prepaymentService.deletePrepayment(prepaymentId);
      setPrepaymentId(null);
      setPaymentAmount('');
      setPaymentMethod(null);

      showSnackbar({
        message: 'Prepago eliminado correctamente',
        type: 'success',
      });
    } catch (error: any) {
      let errorMessage = 'Error al eliminar el prepago';

      if (error?.response?.status === 404) {
        errorMessage = 'El prepago ya no existe o fue eliminado previamente';
        setPrepaymentId(null);
        setPaymentAmount('');
        setPaymentMethod(null);
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showSnackbar({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setShowDeletePrepaymentConfirm(false);
    }
  }, [prepaymentId, showSnackbar]);

  const handlePrepaymentDeleted = useCallback(() => {
    setPrepaymentId(null);
    setPaymentAmount('');
    setPaymentMethod('CASH');
    setShowPrepaymentModal(false);

    showSnackbar({
      message: 'Pago eliminado correctamente',
      type: 'success',
    });
  }, [showSnackbar]);

  return {
    prepaymentId,
    paymentAmount,
    paymentMethod,
    showPrepaymentModal,
    showDeletePrepaymentConfirm,
    setPrepaymentId,
    setPaymentAmount,
    setPaymentMethod,
    setShowPrepaymentModal,
    setShowDeletePrepaymentConfirm,
    handlePrepaymentCreated,
    handleDeletePrepayment,
    confirmDeletePrepayment,
    handlePrepaymentDeleted,
  };
};
