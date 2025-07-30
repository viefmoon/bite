import { z } from 'zod';
import {
  orderTypeSchema,
  orderStatusSchema,
} from '@/app/schemas/domain/order.schema';
import { selectedPizzaCustomizationSchema } from '../../pizzaCustomizations/schema/pizzaCustomization.schema';

export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const receiptListSchema = z.object({
  id: z.string(),
  shiftOrderNumber: z.number(),
  orderType: orderTypeSchema,
  orderStatus: orderStatusSchema,
  total: z.coerce.number(),
  createdAt: z.string(),
  scheduledAt: z.string().optional(),
  finalizedAt: z.string().optional(),
  notes: z.string().optional(),
  paymentsSummary: z
    .object({
      totalPaid: z.number(),
    })
    .optional(),
  table: z
    .object({
      id: z.string(),
      number: z.string(),
      name: z.string(),
      isTemporary: z.boolean(),
      area: z
        .object({
          name: z.string(),
        })
        .optional(),
    })
    .optional(),
  deliveryInfo: z
    .object({
      recipientName: z.string().optional(),
      recipientPhone: z.string().optional(),
      fullAddress: z.string().optional(),
    })
    .optional(),
  preparationScreenStatuses: z
    .array(
      z.object({
        id: z.string(),
        preparationScreenId: z.string(),
        preparationScreenName: z.string(),
        status: z.enum(['PENDING', 'IN_PREPARATION', 'READY']),
        startedAt: z.string().nullable().optional(),
        completedAt: z.string().nullable().optional(),
      }),
    )
    .optional(),
  ticketImpressionCount: z.number().optional(),
  createdBy: z
    .object({
      username: z.string(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
    })
    .optional(),
  isFromWhatsApp: z.boolean().optional(),
});

export type ReceiptList = z.infer<typeof receiptListSchema>;

export const receiptSchema = z.object({
  id: z.string(),
  shiftOrderNumber: z.number(),
  orderType: orderTypeSchema,
  orderStatus: orderStatusSchema,
  total: z.coerce.number(),
  subtotal: z.coerce.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  finalizedAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().optional(),
  tableId: z.string().optional(),
  customerId: z.string().optional(),
  isFromWhatsApp: z.boolean().optional(),
  estimatedDeliveryTime: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      username: z.string().optional(),
    })
    .optional(),
  table: z
    .object({
      id: z.string(),
      number: z.string(),
      name: z.string(),
      isTemporary: z.boolean(),
      area: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional(),
    })
    .optional(),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  deliveryInfo: z
    .object({
      id: z.string(),
      recipientName: z.string().nullable().optional(),
      recipientPhone: z.string().nullable().optional(),
      deliveryInstructions: z.string().nullable().optional(),
      fullAddress: z.string().nullable().optional(),
      street: z.string().nullable().optional(),
      number: z.string().nullable().optional(),
      interiorNumber: z.string().nullable().optional(),
      neighborhood: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      zipCode: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
    })
    .optional(),
  preparationScreenStatuses: z
    .array(
      z.object({
        id: z.string(),
        preparationScreenId: z.string(),
        preparationScreenName: z.string(),
        status: z.enum(['PENDING', 'IN_PREPARATION', 'READY']),
        startedAt: z.string().nullable().optional(),
        completedAt: z.string().nullable().optional(),
      }),
    )
    .optional(),
  orderItems: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().optional(),
      basePrice: z.number(),
      finalPrice: z.number(),
      preparationNotes: z.string().optional(),
      preparationStatus: z.string().optional(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
      }),
      productVariant: z
        .object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
        })
        .optional(),
      productModifiers: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
          }),
        )
        .optional(),
      selectedPizzaCustomizations: z
        .array(selectedPizzaCustomizationSchema)
        .optional(),
    }),
  ),
  payments: z
    .array(
      z.object({
        id: z.string(),
        amount: z.number(),
        paymentMethod: z.string(),
        paymentStatus: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    )
    .optional(),
  adjustments: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        amount: z.number(),
        reason: z.string().optional(),
        createdAt: z.string(),
      }),
    )
    .optional(),
  ticketImpressions: z
    .array(
      z.object({
        id: z.string(),
        ticketType: z.string(),
        impressionTime: z.string(),
        user: z
          .object({
            id: z.string(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
          })
          .optional(),
        printer: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export type Receipt = z.infer<typeof receiptSchema>;

export const receiptsListResponseSchema = z.array(receiptListSchema);
export type ReceiptsListResponse = z.infer<typeof receiptsListResponseSchema>;

export const receiptFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  orderType: orderTypeSchema.optional(),
});

export type ReceiptFilters = z.infer<typeof receiptFiltersSchema>;
