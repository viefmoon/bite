import { z } from 'zod';

export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER']);
export const paymentStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const PaymentMethodEnum = paymentMethodSchema.enum;
export const PaymentStatusEnum = paymentStatusSchema.enum;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  paymentMethod: paymentMethodSchema,
  amount: z.number().positive(),
  paymentStatus: paymentStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  order: z.object({
    id: z.string().uuid(),
    shiftOrderNumber: z.number(),
    total: z.number(),
  }).optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentDtoSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: paymentMethodSchema,
  amount: z.number().positive(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentDtoSchema>;

export const updatePaymentDtoSchema = z.object({
  paymentMethod: paymentMethodSchema.optional(),
  amount: z.number().positive().optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export type UpdatePaymentDto = z.infer<typeof updatePaymentDtoSchema>;