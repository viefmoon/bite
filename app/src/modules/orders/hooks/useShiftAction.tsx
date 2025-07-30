import { useState } from 'react';
import { shiftsService } from '@/services/shifts';
import type { Shift } from '@/app/schemas/domain/shift.schema';
import { useSnackbarStore } from '@/app/stores/snackbarStore';

type ShiftActionMode = 'open' | 'close';

interface UseShiftActionProps {
  mode: ShiftActionMode;
  shift?: Shift | null;
}

export const useShiftAction = ({ mode, shift }: UseShiftActionProps) => {
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const isOpenMode = mode === 'open';

  const handleCashAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    if (parts[1] && parts[1].length > 2) {
      setCashAmount(parts[0] + '.' + parts[1].substring(0, 2));
    } else {
      setCashAmount(cleaned);
    }
  };

  const validateForm = (): boolean => {
    if (!cashAmount) {
      setError(
        isOpenMode
          ? 'El monto inicial es requerido'
          : 'El efectivo final es requerido',
      );
      return false;
    }

    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Ingresa un monto válido');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return false;
    }

    const amount = parseFloat(cashAmount);
    setLoading(true);
    setError('');

    try {
      if (isOpenMode) {
        await shiftsService.openShift({
          initialCash: amount,
          notes: notes || undefined,
        });
        showSnackbar({
          message: 'Turno abierto exitosamente',
          type: 'success',
        });
      } else {
        await shiftsService.closeShift({
          finalCash: amount,
          closeNotes: notes || undefined,
        });
        showSnackbar({
          message: 'Turno cerrado exitosamente',
          type: 'success',
        });
      }

      // Resetear formulario
      setCashAmount('');
      setNotes('');
      return true;
    } catch (error: any) {
      let errorMessage = isOpenMode
        ? 'Error al abrir el turno'
        : 'Error al cerrar el turno';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
      showSnackbar({ message: errorMessage, type: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCashAmount('');
    setNotes('');
    setError('');
  };

  const calculateDifference = () => {
    if (isOpenMode || !cashAmount || !shift?.expectedCash) return null;
    const cash = parseFloat(cashAmount);
    if (isNaN(cash)) return null;
    return cash - shift.expectedCash;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    // Estado
    cashAmount,
    setCashAmount,
    notes,
    setNotes,
    loading,
    error,
    isOpenMode,

    // Funciones
    handleCashAmountChange,
    handleSubmit,
    resetForm,
    calculateDifference,
    formatCurrency,
    formatTime,
    handleNotesChange: setNotes,
  };
};
