export class DeliveryInfo {
  id: string;

  orderId: string;

  fullAddress?: string;

  street?: string;

  number?: string;

  interiorNumber?: string;

  neighborhood?: string;

  city?: string;

  state?: string;

  zipCode?: string;

  country?: string;

  recipientName?: string;

  recipientPhone?: string;

  deliveryInstructions?: string;

  latitude?: number;

  longitude?: number;

  createdAt: Date;

  updatedAt: Date;
}