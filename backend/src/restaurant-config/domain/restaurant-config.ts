export class RestaurantConfig {
  id: string;
  acceptingOrders: boolean;
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  openingTime: string | null;
  closingTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}
