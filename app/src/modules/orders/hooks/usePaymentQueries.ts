import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
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
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentService.createPayment(dto),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.byOrder(data.orderId),
      });
      // Invalidar también las queries de órdenes para que se actualice el estado de pago
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      showSnackbar({
        message: 'Pago registrado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al registrar el pago',
        type: 'error',
      });
    },
  });
};

export const useDeletePaymentMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (id: string) => paymentService.deletePayment(id),
    onSuccess: () => {
      // Invalidar todas las queries de pagos
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      // Invalidar también las queries de órdenes para que se actualice el estado de pago
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      showSnackbar({
        message: 'Pago eliminado exitosamente',
        type: 'success',
      });
    },
    onError: (error: any) => {
      showSnackbar({
        message: error.response?.data?.message || 'Error al eliminar el pago',
        type: 'error',
      });
    },
  });
};
