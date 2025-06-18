import { RestaurantConfig } from './restaurant-config';

export class BusinessHours {
  id: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  openingTime: string | null; // Hora de apertura en formato HH:mm (null = cerrado)
  closingTime: string | null; // Hora de cierre en formato HH:mm (null = cerrado)
  isClosed: boolean; // true si el restaurante está cerrado ese día
  restaurantConfigId: string;
  restaurantConfig?: RestaurantConfig;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
