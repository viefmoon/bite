import { z } from 'zod';

export const DeliveryInfoSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  fullAddress: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type DeliveryInfo = z.infer<typeof DeliveryInfoSchema>;