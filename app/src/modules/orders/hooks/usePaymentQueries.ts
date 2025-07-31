import { paymentService } from '../services/paymentService';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import type {
  CreatePaymentDto,
} from '../schema/payment.schema';

// Query Keys (simplificado - solo para mutaciones)
export const paymentKeys = {
  all: ['payments'] as const,
};

// Mutations
export const useCreatePaymentMutation = () => {
  return useApiMutation(
    (dto: CreatePaymentDto) => paymentService.createPayment(dto),
    {
      successMessage: 'Pago registrado exitosamente',
      invalidateQueryKeys: [['orders']],
    },
  );
};

export const useDeletePaymentMutation = () => {
  return useApiMutation((id: string) => paymentService.deletePayment(id), {
    successMessage: 'Pago eliminado exitosamente',
    invalidateQueryKeys: [['orders']],
  });
};
