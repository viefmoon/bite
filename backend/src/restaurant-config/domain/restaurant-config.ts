import { BusinessHours } from './business-hours';

export class RestaurantConfig {
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
  estimatedPickupTime: number; // Tiempo estimado de recolección en minutos
  estimatedDeliveryTime: number; // Tiempo estimado de entrega en minutos
  estimatedDineInTime: number; // Tiempo estimado para servir en mesa en minutos
  openingGracePeriod: number; // Minutos después de abrir antes de aceptar pedidos
  closingGracePeriod: number; // Minutos antes de cerrar para dejar de aceptar pedidos
  timeZone: string; // Zona horaria del restaurante
  scheduledOrdersLeadTime: number; // Minutos antes de la hora programada para mostrar órdenes en preparación

  // Configuración de delivery
  deliveryCoverageArea: any | null; // Polígono de cobertura
  minimumOrderValueForDelivery: number; // Valor mínimo de orden para entrega

  // Relaciones
  businessHours: BusinessHours[];

  createdAt: Date;
  updatedAt: Date;
}
