export interface DeliveryCoveragePoint {
  lat: number;
  lng: number;
}

export interface BusinessHours {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  openingTime: string | null; // HH:mm
  closingTime: string | null; // HH:mm
  closesNextDay?: boolean; // true si cierra después de medianoche
  isClosed: boolean;
  restaurantConfigId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantConfig {
  id: string;
  // Información básica
  restaurantName: string;
  phoneMain: string | null;
  phoneSecondary: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;

  // Configuración de operación
  acceptingOrders: boolean;
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  estimatedDineInTime: number;
  openingGracePeriod: number;
  closingGracePeriod: number;
  timeZone: string;
  scheduledOrdersLeadTime: number;

  // Configuración de delivery
  deliveryCoverageArea: DeliveryCoveragePoint[] | null;

  // Relaciones
  businessHours: BusinessHours[];

  createdAt: string;
  updatedAt: string;
}

export interface UpdateRestaurantConfigDto {
  // Información básica
  restaurantName?: string;
  phoneMain?: string | null;
  phoneSecondary?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  // Configuración de operación
  acceptingOrders?: boolean;
  estimatedPickupTime?: number;
  estimatedDeliveryTime?: number;
  estimatedDineInTime?: number;
  openingGracePeriod?: number;
  closingGracePeriod?: number;
  timeZone?: string;
  scheduledOrdersLeadTime?: number;

  // Configuración de delivery
  deliveryCoverageArea?: DeliveryCoveragePoint[] | null;

  // Horarios
  businessHours?: CreateBusinessHoursDto[];
}

export interface CreateBusinessHoursDto {
  dayOfWeek: number;
  openingTime?: string | null;
  closingTime?: string | null;
  closesNextDay?: boolean;
  isClosed?: boolean;
  restaurantConfigId?: string;
}

export interface UpdateBusinessHoursDto {
  openingTime?: string | null;
  closingTime?: string | null;
  closesNextDay?: boolean;
  isClosed?: boolean;
}
