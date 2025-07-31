import { useState, useEffect, useMemo } from 'react';
import { Keyboard } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
  type PaymentMethod,
} from '../schema/payment.schema';
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
} from './usePaymentQueries';
import {
  useCompleteOrderMutation,
  useGetOrderByIdQuery,
} from './useOrdersQueries';
import { prepaymentService } from '@/modules/payments/services/prepaymentService';

interface UsePaymentModalProps {
  visible: boolean;
  orderId?: string;
  orderTotal: number;
  mode?: 'payment' | 'prepayment';
  existingPrepaymentId?: string;
  onPaymentRegistered?: () => void;
}

export const usePaymentModal = ({
  visible,
  orderId,
  orderTotal,
  mode = 'payment',
  existingPrepaymentId,
  onPaymentRegistered,
}: UsePaymentModalProps) => {
  const queryClient = useQueryClient();

  // Estado del formulario
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.CASH,
  );
  const [amount, setAmount] = useState<number | null>(null);
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isCreatingPrepayment, setIsCreatingPrepayment] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] =
    useState(false);

  // Consultar payments actualizados directamente de la orden
  const { data: orderData, isLoading: isLoadingPayments } =
    useGetOrderByIdQuery(orderId, {
      enabled: !!orderId && visible && mode === 'payment',
    });

  // Usar payments actualizados como única fuente de verdad
  const payments = useMemo(() => {
    if (
      mode === 'payment' &&
      orderData?.payments &&
      Array.isArray(orderData.payments)
    ) {
      return orderData.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        orderId: payment.orderId,
      }));
    }
    return [];
  }, [mode, orderData?.payments]);

  // Mutations
  const createPaymentMutation = useCreatePaymentMutation();
  const deletePaymentMutation = useDeletePaymentMutation();
  const completeOrderMutation = useCompleteOrderMutation();

  // Calcular totales
  const totalPaid = useMemo(() => {
    if (mode === 'prepayment') {
      return 0;
    }
    return payments
      .filter((p) => p.paymentStatus === PaymentStatusEnum.COMPLETED)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }, [payments, mode]);

  const pendingAmount = orderTotal - totalPaid;
  const isFullyPaid = pendingAmount <= 0;

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (mode === 'prepayment') {
        setAmount(orderTotal);
      } else {
        setAmount(pendingAmount > 0 ? pendingAmount : null);
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
    if (!amount || amount <= 0) {
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
    if (!amount) throw new Error('Amount is required');

    try {
      if (mode === 'prepayment') {
        // Crear pre-pago
        setIsCreatingPrepayment(true);
        const prepayment = await prepaymentService.createPrepayment({
          paymentMethod: selectedMethod,
          amount: amount,
        });

        return prepayment;
      } else {
        // Crear pago normal
        if (!orderId) throw new Error('Order ID is required');

        await createPaymentMutation.mutateAsync({
          orderId: orderId,
          paymentMethod: selectedMethod,
          amount: amount,
        });

        // Actualizar datos
        queryClient.invalidateQueries({
          queryKey: ['orders', 'detail', orderId],
        });

        if (onPaymentRegistered) {
          onPaymentRegistered();
        }

        // Resetear formulario
        setAmount(null);
        setShowChangeCalculator(false);

        return { shouldClose: pendingAmount - amount <= 0 };
      }
    } finally {
      setIsCreatingPrepayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    await deletePaymentMutation.mutateAsync(paymentToDelete);

    // Actualizar datos
    if (orderId) {
      queryClient.invalidateQueries({
        queryKey: ['orders', 'detail', orderId],
      });
    }

    setShowDeleteConfirm(false);
    setPaymentToDelete(null);

    if (onPaymentRegistered) {
      onPaymentRegistered();
    }
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
    setAmount(null);
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

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setPaymentToDelete(null);
  };

  const openFinalizeConfirm = () => {
    setShowFinalizeConfirm(true);
  };

  const closeFinalizeConfirm = () => {
    setShowFinalizeConfirm(false);
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
    closeDeleteConfirm,
    openFinalizeConfirm,
    closeFinalizeConfirm,
    openDeletePrepaymentConfirm,
  };
};
