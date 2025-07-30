import { z } from 'zod';

// Enum para los estados de la orden
export const orderStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'IN_PREPARATION',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Enum para los tipos de orden
export const orderTypeSchema = z.enum(['DINE_IN', 'TAKE_AWAY', 'DELIVERY']);
export type OrderType = z.infer<typeof orderTypeSchema>;

// Schema simplificado que coincide exactamente con el backend
export const orderSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  tableId: z.string().nullable(),
  shiftOrderNumber: z.number(),
  shiftId: z.string(),
  scheduledAt: z.string().nullable(),
  orderStatus: orderStatusSchema,
  orderType: orderTypeSchema,
  subtotal: z.number(),
  total: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  finalizedAt: z.string().nullable(),
  notes: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  isFromWhatsApp: z.boolean().optional(),
  estimatedDeliveryTime: z.string().optional().nullable(),
  // Relaciones opcionales
  user: z.any().optional().nullable(),
  table: z.any().optional().nullable(),
  orderItems: z.array(z.any()).optional(),
  payments: z.array(z.any()).optional().nullable(),
  adjustments: z.array(z.any()).optional(),
  deliveryInfo: z.any().optional().nullable(),
  preparationScreenStatuses: z.array(z.any()).optional(),
  ticketImpressions: z.array(z.any()).optional(),
  paymentsSummary: z
    .object({
      totalPaid: z.number(),
    })
    .optional(),
  customer: z.any().optional().nullable(),
  ticketImpressionCount: z.number().optional(),
});

export type Order = z.infer<typeof orderSchema>;
