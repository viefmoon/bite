import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';

export interface ProductSalesSummary {
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  averagePrice: number;
}

export interface SubcategorySalesSummary {
  subcategoryId: string;
  subcategoryName: string;
  quantity: number;
  totalAmount: number;
  products: ProductSalesSummary[];
}

export interface CategorySalesSummary {
  categoryId: string;
  categoryName: string;
  quantity: number;
  totalAmount: number;
  percentage: number;
  subcategories: SubcategorySalesSummary[];
}

export interface ShiftSalesSummary {
  shiftId: string;
  shiftNumber: number;
  date: string;
  totalSales: number;
  totalQuantity: number;
  completedOrders: number;
  averageTicket: number;
  categories: CategorySalesSummary[];
  topProducts: ProductSalesSummary[];
  startTime: string;
  endTime: string | null;
}

export function useShiftSalesSummary(shiftId: string | null) {
  return useQuery({
    queryKey: ['shiftSalesSummary', shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
      
      const response = await apiClient.get(
        `/api/v1/orders/shift/${shiftId}/sales-summary`
      );
      
      if (!response.ok) {
        throw new Error(response.problem || 'Error al obtener resumen de ventas');
      }
      
      return response.data as ShiftSalesSummary;
    },
    enabled: !!shiftId,
  });
}