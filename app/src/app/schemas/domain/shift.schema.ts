import { z } from 'zod';
import { userSchema } from './user.schema';

export const shiftStatusSchema = z.enum(['OPEN', 'CLOSED']);

export const shiftSchema = z.object({
  id: z.string(),
  date: z.string(),
  globalShiftNumber: z.number(),
  shiftNumber: z.number(),
  status: shiftStatusSchema,
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  openedBy: userSchema,
  closedBy: userSchema.nullable(),
  initialCash: z.number(),
  finalCash: z.number().nullable(),
  totalSales: z.number().nullable(),
  totalOrders: z.number().nullable(),
  cashDifference: z.number().nullable(),
  expectedCash: z.number().nullable().optional(),
  notes: z.string().nullable(),
  closeNotes: z.string().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const openShiftDtoSchema = z.object({
  initialCash: z.number(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

export const closeShiftDtoSchema = z.object({
  finalCash: z.number(),
  closeNotes: z.string().optional(),
});

export const paymentMethodSummarySchema = z.object({
  method: z.string(),
  count: z.number(),
  total: z.number(),
});

export const productSummarySchema = z.object({
  productName: z.string(),
  quantity: z.number(),
  total: z.number(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
  modifiers: z.array(z.string()).optional(),
});

export const shiftOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  total: z.number(),
  status: z.string(),
  paymentMethod: z.string(),
  customerName: z.string().nullable(),
  createdAt: z.string(),
  items: z.array(orderItemSchema),
});

export const shiftSummarySchema = z.object({
  shift: shiftSchema,
  ordersCount: z.number(),
  totalSales: z.number(),
  paymentMethodsSummary: z.array(paymentMethodSummarySchema),
  productsSummary: z.array(productSummarySchema),
});

export type Shift = z.infer<typeof shiftSchema>;
export type ShiftStatus = z.infer<typeof shiftStatusSchema>;
export type OpenShiftDto = z.infer<typeof openShiftDtoSchema>;
export type CloseShiftDto = z.infer<typeof closeShiftDtoSchema>;
export type PaymentMethodSummary = z.infer<typeof paymentMethodSummarySchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type ShiftOrder = z.infer<typeof shiftOrderSchema>;
export type ShiftSummary = z.infer<typeof shiftSummarySchema>;