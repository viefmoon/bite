export interface RestaurantConfig {
  id: string;
  acceptingOrders: boolean;
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRestaurantConfigDto {
  acceptingOrders?: boolean;
  estimatedPickupTime?: number;
  estimatedDeliveryTime?: number;
}