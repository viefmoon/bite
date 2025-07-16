import ApiClientWrapper from '@/app/services/apiClientWrapper';
import { KitchenOrder, KitchenFilters } from '../types/kitchen.types';
import { API_PATHS } from '@/app/constants/apiPaths';

interface _PaginationResponse<T> {
  data: T[];
  hasNextPage: boolean;
}

class KitchenService {
  async getKitchenOrders(
    filters: Partial<KitchenFilters> = {},
  ): Promise<KitchenOrder[]> {
    // Construir query string manualmente para evitar problemas de serialización
    const queryParams = new URLSearchParams();

    // Solo enviar orderType si tiene un valor (no es undefined)
    if (filters.orderType) {
      queryParams.append('orderType', filters.orderType);
    }
    if (filters.showPrepared !== undefined) {
      queryParams.append('showPrepared', String(filters.showPrepared));
    }
    if (filters.showAllProducts !== undefined) {
      queryParams.append('showAllProducts', String(filters.showAllProducts));
    }
    if (filters.ungroupProducts !== undefined) {
      queryParams.append('ungroupProducts', String(filters.ungroupProducts));
    }
    if (filters.screenId !== undefined) {
      queryParams.append('screenId', filters.screenId);
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_PATHS.KITCHEN_ORDERS}?${queryString}`
      : API_PATHS.KITCHEN_ORDERS;

    const response = await ApiClientWrapper.get<KitchenOrder[]>(url);
    return response.data || [];
  }

  async markItemPrepared(
    itemId: string,
    isPrepared: boolean = true,
  ): Promise<void> {
    await ApiClientWrapper.patch(
      API_PATHS.KITCHEN_MARK_PREPARED.replace(':itemId', itemId),
      {
        isPrepared,
      },
    );
  }

  async unmarkItemPrepared(itemId: string): Promise<void> {
    await ApiClientWrapper.patch(
      API_PATHS.KITCHEN_MARK_UNPREPARED.replace(':itemId', itemId),
    );
  }

  async startOrderPreparation(orderId: string): Promise<void> {
    await ApiClientWrapper.patch(
      API_PATHS.KITCHEN_ORDERS_START_PREPARATION.replace(':orderId', orderId),
    );
  }

  async cancelOrderPreparation(orderId: string): Promise<void> {
    await ApiClientWrapper.patch(
      API_PATHS.KITCHEN_ORDERS_CANCEL_PREPARATION.replace(':orderId', orderId),
    );
  }

  async completeOrderPreparation(orderId: string): Promise<void> {
    await ApiClientWrapper.patch(
      API_PATHS.KITCHEN_ORDERS_COMPLETE_PREPARATION.replace(
        ':orderId',
        orderId,
      ),
    );
  }
}

export const kitchenService = new KitchenService();
