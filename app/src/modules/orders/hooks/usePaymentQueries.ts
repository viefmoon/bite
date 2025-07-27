import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import type {
  CreatePaymentDto,
  PaymentMethod,
  PaymentStatus,
} from '../schema/payment.schema';

// Query Keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: {
    orderId?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
  }) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  byOrder: (orderId: string) => [...paymentKeys.all, 'order', orderId] as const,
};

// Queries

export const useGetPaymentsByOrderIdQuery = (
  orderId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: paymentKeys.byOrder(orderId),
    queryFn: () => paymentService.getPaymentsByOrderId(orderId),
    enabled: options?.enabled !== undefined ? options.enabled : !!orderId,
    initialData: [],
  });
};

// Mutations
export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    (dto: CreatePaymentDto) => paymentService.createPayment(dto),
    {
      successMessage: 'Pago registrado exitosamente',
      invalidateQueryKeys: [paymentKeys.lists(), ['orders']],
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: paymentKeys.byOrder(data.orderId),
        });
      },
    },
  );
};

export const useDeletePaymentMutation = () => {
  return useApiMutation((id: string) => paymentService.deletePayment(id), {
    successMessage: 'Pago eliminado exitosamente',
    invalidateQueryKeys: [paymentKeys.all, ['orders']],
  });
};
