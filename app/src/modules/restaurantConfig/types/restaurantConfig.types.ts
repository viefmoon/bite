export interface RestaurantConfig {
  id: string;
  acceptingOrders: boolean;
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  openingTime: string | null;
  closingTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRestaurantConfigDto {
  acceptingOrders?: boolean;
  estimatedPickupTime?: number;
  estimatedDeliveryTime?: number;
  openingTime?: string | null;
  closingTime?: string | null;
}
