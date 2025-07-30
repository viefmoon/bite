import { z } from 'zod';

// Esquema para DeliveryCoveragePoint
export const deliveryCoveragePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type DeliveryCoveragePoint = z.infer<typeof deliveryCoveragePointSchema>;

// Esquema para BusinessHours
export const businessHoursSchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().min(0).max(6), // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  openingTime: z.string().nullable(), // HH:mm
  closingTime: z.string().nullable(), // HH:mm
  closesNextDay: z.boolean().optional(), // true si cierra después de medianoche
  isClosed: z.boolean(),
  restaurantConfigId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BusinessHours = z.infer<typeof businessHoursSchema>;

// Esquema principal para RestaurantConfig
export const restaurantConfigSchema = z.object({
  id: z.string(),
  // Información básica
  restaurantName: z.string(),
  phoneMain: z.string().nullable(),
  phoneSecondary: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),

  // Configuración de operación
  acceptingOrders: z.boolean(),
  estimatedPickupTime: z.number(),
  estimatedDeliveryTime: z.number(),
  estimatedDineInTime: z.number(),
  openingGracePeriod: z.number(),
  closingGracePeriod: z.number(),
  timeZone: z.string(),
  scheduledOrdersLeadTime: z.number(),

  // Configuración de delivery
  deliveryCoverageArea: z.array(deliveryCoveragePointSchema).nullable(),
  minimumOrderValueForDelivery: z.union([z.number(), z.string()]), // Puede venir como string desde el backend (decimal)

  // Relaciones
  businessHours: z.array(businessHoursSchema),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RestaurantConfig = z.infer<typeof restaurantConfigSchema>;

// Esquemas para DTOs
export const createBusinessHoursDtoSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openingTime: z.string().nullable().optional(),
  closingTime: z.string().nullable().optional(),
  closesNextDay: z.boolean().optional(),
  isClosed: z.boolean().optional(),
  restaurantConfigId: z.string().optional(),
});

export type CreateBusinessHoursDto = z.infer<
  typeof createBusinessHoursDtoSchema
>;


export const updateRestaurantConfigDtoSchema = z.object({
  // Información básica
  restaurantName: z.string().optional(),
  phoneMain: z.string().nullable().optional(),
  phoneSecondary: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),

  // Configuración de operación
  acceptingOrders: z.boolean().optional(),
  estimatedPickupTime: z.number().optional(),
  estimatedDeliveryTime: z.number().optional(),
  estimatedDineInTime: z.number().optional(),
  openingGracePeriod: z.number().optional(),
  closingGracePeriod: z.number().optional(),
  timeZone: z.string().optional(),
  scheduledOrdersLeadTime: z.number().optional(),

  // Configuración de delivery
  deliveryCoverageArea: z
    .array(deliveryCoveragePointSchema)
    .nullable()
    .optional(),
  minimumOrderValueForDelivery: z.number().optional(),

  // Horarios
  businessHours: z.array(createBusinessHoursDtoSchema).optional(),
});

export type UpdateRestaurantConfigDto = z.infer<
  typeof updateRestaurantConfigDtoSchema
>;
