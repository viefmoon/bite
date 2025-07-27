import { useState, useEffect, useMemo } from 'react';
import { Keyboard } from 'react-native';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
  type PaymentMethod,
} from '../schema/payment.schema';
import {
  useGetPaymentsByOrderIdQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
} from './usePaymentQueries';
import { useCompleteOrderMutation } from './useOrdersQueries';
import { prepaymentService } from '@/modules/payments/services/prepaymentService';

interface UsePaymentModalProps {
  visible: boolean;
  orderId?: string;
  orderTotal: number;
  mode?: 'payment' | 'prepayment';
  existingPrepaymentId?: string;
}

export const usePaymentModal = ({
  visible,
  orderId,
  orderTotal,
  mode = 'payment',
  existingPrepaymentId,
}: UsePaymentModalProps) => {
  // Estado del formulario
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.CASH,
  );
  const [amount, setAmount] = useState('');
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isCreatingPrepayment, setIsCreatingPrepayment] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] =
    useState(false);

  // Queries y mutations
  const { data: payments = [], isLoading: isLoadingPayments } =
    useGetPaymentsByOrderIdQuery(orderId || '', {
      enabled: mode === 'payment' && !!orderId,
    });
  const createPaymentMutation = useCreatePaymentMutation();
  const deletePaymentMutation = useDeletePaymentMutation();
  const completeOrderMutation = useCompleteOrderMutation();

  // Calcular totales
  const totalPaid = useMemo(() => {
    if (mode === 'prepayment') {
      return 0;
    }
    return (payments || [])
      .filter((p) => p.paymentStatus === PaymentStatusEnum.COMPLETED)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }, [payments, mode]);

  const pendingAmount = orderTotal - totalPaid;
  const isFullyPaid = pendingAmount <= 0;

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (mode === 'prepayment') {
        setAmount(orderTotal.toFixed(2));
      } else {
        setAmount(pendingAmount > 0 ? pendingAmount.toFixed(2) : '');
      }
      setShowChangeCalculator(false);
      setSelectedMethod(PaymentMethodEnum.CASH);
    }
  }, [visible, pendingAmount, orderTotal, mode]);

  // Manejar el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    // Si es efectivo, mostrar calculadora de cambio
    if (selectedMethod === PaymentMethodEnum.CASH) {
      setShowChangeCalculator(true);
      return;
    }

    // Para otros métodos de pago, procesar directamente
    await processPayment();
  };

  const processPayment = async (): Promise<
    | { id: string; amount: number; paymentMethod: string } // Prepayment result
    | { shouldClose: boolean } // Payment result
  > => {
    const parsedAmount = parseFloat(amount);

    try {
      if (mode === 'prepayment') {
        // Crear pre-pago
        setIsCreatingPrepayment(true);
        const prepayment = await prepaymentService.createPrepayment({
          paymentMethod: selectedMethod,
          amount: parsedAmount,
        });

        return prepayment;
      } else {
        // Crear pago normal
        if (!orderId) throw new Error('Order ID is required');

        await createPaymentMutation.mutateAsync({
          orderId: orderId,
          paymentMethod: selectedMethod,
          amount: parsedAmount,
        });

        // Resetear formulario
        setAmount('');
        setShowChangeCalculator(false);

        return { shouldClose: pendingAmount - parsedAmount <= 0 };
      }
    } finally {
      setIsCreatingPrepayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    await deletePaymentMutation.mutateAsync(paymentToDelete);
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
  };

  const handleFinalizeOrder = async () => {
    if (!orderId) return false;

    await completeOrderMutation.mutateAsync(orderId);
    setShowFinalizeConfirm(false);
    return true;
  };

  const handleDeletePrepayment = async () => {
    if (!existingPrepaymentId) return;

    try {
      setIsCreatingPrepayment(true);
      await prepaymentService.deletePrepayment(existingPrepaymentId);
      setShowDeletePrepaymentConfirm(false);
      return true;
    } finally {
      setIsCreatingPrepayment(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedMethod(PaymentMethodEnum.CASH);
    setShowChangeCalculator(false);
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
    setShowFinalizeConfirm(false);
    setShowDeletePrepaymentConfirm(false);
  };

  const openDeleteConfirm = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setShowDeleteConfirm(true);
  };

  const openFinalizeConfirm = () => {
    setShowFinalizeConfirm(true);
  };

  const openDeletePrepaymentConfirm = () => {
    setShowDeletePrepaymentConfirm(true);
  };

  return {
    // Estado
    selectedMethod,
    setSelectedMethod,
    amount,
    setAmount,
    showChangeCalculator,
    setShowChangeCalculator,
    showDeleteConfirm,
    showFinalizeConfirm,
    showDeletePrepaymentConfirm,
    keyboardVisible,
    isCreatingPrepayment,

    // Datos computados
    payments,
    isLoadingPayments,
    totalPaid,
    pendingAmount,
    isFullyPaid,

    // Mutaciones
    createPaymentMutation,
    deletePaymentMutation,
    completeOrderMutation,

    // Funciones
    handleSubmit,
    processPayment,
    handleDeletePayment,
    handleFinalizeOrder,
    handleDeletePrepayment,
    resetForm,
    openDeleteConfirm,
    openFinalizeConfirm,
    openDeletePrepaymentConfirm,
  };
};
