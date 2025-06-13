export interface CloudOrderItem {
  productId: string;
  productVariantId?: string;
  quantity: number;
  comments?: string;
  selectedPizzaIngredients?: {
    pizzaIngredientId: string;
    half: 'left' | 'right' | 'full';
    action: 'add' | 'remove';
  }[];
  selectedModifiers?: {
    modifierId: string;
  }[];
}

export interface CloudOrder {
  id?: string;
  dailyOrderNumber?: number;
  orderType: 'delivery' | 'pickup';
  status: 'created' | 'accepted' | 'in_preparation' | 'prepared' | 'in_delivery' | 'finished' | 'canceled';
  items: CloudOrderItem[];
  customerId: string;
  customerPhone: string;
  deliveryInfo?: {
    address: string;
    additionalDetails?: string;
    latitude?: number;
    longitude?: number;
  };
  pickupName?: string;
  totalCost: number;
  estimatedTime?: number;
  scheduledDeliveryTime?: Date;
  syncedWithLocal: boolean;
  localId?: number;
  whatsappMessageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}