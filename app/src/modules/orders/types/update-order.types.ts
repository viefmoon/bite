import type { OrderType } from './orders.types';
import type { Order } from '../../../app/schemas/domain/order.schema';
import type { DeliveryInfo } from '../../../app/schemas/domain/delivery-info.schema';

// Interfaz para modificadores de producto
export interface ProductModifierDto {
  modifierId: string;
}

// Interfaz para personalizaciones de pizza seleccionadas
export interface SelectedPizzaCustomizationDto {
  pizzaCustomizationId: string;
  half: 'FULL' | 'HALF_1' | 'HALF_2';
  action: 'ADD' | 'REMOVE';
}

// Interfaz para items en el DTO de actualización
export interface OrderItemDtoForBackend {
  id?: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number; // NOTA: Siempre será 1, el backend ya no maneja cantidades
  basePrice: number;
  finalPrice: number;
  preparationNotes?: string | null;
  productModifiers?: ProductModifierDto[]; // Array de objetos con modifierId
  selectedPizzaCustomizations?: SelectedPizzaCustomizationDto[]; // Personalizaciones de pizza
}

// Interfaz para ajustes en el DTO
export interface OrderAdjustmentDto {
  orderId?: string;
  name: string;
  isPercentage: boolean;
  value?: number;
  amount?: number;
}

// Interfaz para el payload de actualización de orden
export interface UpdateOrderPayload {
  orderType?: OrderType;
  items?: OrderItemDtoForBackend[];
  tableId?: string | null;
  scheduledAt?: Date | null;
  deliveryInfo?: DeliveryInfo;
  notes?: string | null;
  status?: Order['orderStatus'];
  total?: number;
  subtotal?: number;
  adjustments?: OrderAdjustmentDto[];
}
