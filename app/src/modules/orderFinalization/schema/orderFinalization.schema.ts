import { z } from 'zod';
import { selectedPizzaCustomizationSchema } from '@/app/schemas/domain/order.schema';

const deliveryInfoSchema = z.object({
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  fullAddress: z.string().optional(),
});

export const orderForFinalizationListSchema = z.object({
  id: z.string(),
  shiftOrderNumber: z.number(),
  orderType: z.enum(['TAKE_AWAY', 'DELIVERY', 'DINE_IN']),
  orderStatus: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'READY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  total: z.union([z.string(), z.number()]),
  createdAt: z.string(),
  scheduledAt: z.string().optional(),
  paymentsSummary: z
    .object({
      totalPaid: z.number(),
    })
    .optional(),
  deliveryInfo: z
    .object({
      recipientName: z.string().optional(),
      recipientPhone: z.string().optional(),
      fullAddress: z.string().optional(),
    })
    .optional(),
  preparationScreens: z.array(z.string()).optional(),
  preparationScreenStatuses: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'READY']),
      }),
    )
    .optional(),
  ticketImpressionCount: z.number().optional(),
  notes: z.string().optional(),
  table: z
    .object({
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
  createdBy: z
    .object({
      username: z.string(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
    })
    .optional(),
  isFromWhatsApp: z.boolean().optional(),
});

export type OrderForFinalizationList = z.infer<
  typeof orderForFinalizationListSchema
>;

export const orderItemModifierForFinalizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.union([z.number(), z.string()]),
});

export type OrderItemModifierForFinalization = z.infer<
  typeof orderItemModifierForFinalizationSchema
>;

export const orderItemForFinalizationSchema = z.object({
  id: z.string(),
  quantity: z.number(),
  basePrice: z.string(),
  finalPrice: z.string(),
  preparationNotes: z.string().optional(),
  preparationStatus: z.string().optional(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
  productVariant: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  modifiers: z.array(orderItemModifierForFinalizationSchema),
  selectedPizzaCustomizations: z
    .array(selectedPizzaCustomizationSchema)
    .optional(),
});

export type OrderItemForFinalization = z.infer<
  typeof orderItemForFinalizationSchema
>;

export const orderForFinalizationSchema = z.object({
  id: z.string(),
  shiftOrderNumber: z.number(),
  deliveryInfo: deliveryInfoSchema,
  orderType: z.enum(['TAKE_AWAY', 'DELIVERY', 'DINE_IN']),
  orderStatus: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'READY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  total: z.union([z.string(), z.number()]),
  orderItems: z.array(orderItemForFinalizationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  scheduledAt: z.string().optional(),
  tableId: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .optional(),
  table: z
    .object({
      id: z.string(),
      number: z.string(),
      area: z
        .object({
          name: z.string(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  isFromWhatsApp: z.boolean().optional(),
  preparationScreens: z.array(z.string()).optional(),
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
  notes: z.string().optional(),
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

export type OrderForFinalization = z.infer<typeof orderForFinalizationSchema>;

export const orderSelectionStateSchema = z.object({
  selectedOrders: z.set(z.string()),
  totalAmount: z.number(),
});

export type OrderSelectionState = z.infer<typeof orderSelectionStateSchema>;

export const finalizeOrdersPayloadSchema = z.object({
  orderIds: z.array(z.string()),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type FinalizeOrdersPayload = z.infer<typeof finalizeOrdersPayloadSchema>;

export const orderFinalizationFilterSchema = z.enum([
  'delivery',
  'take_away',
  'dine_in',
]);
export type OrderFinalizationFilter = z.infer<
  typeof orderFinalizationFilterSchema
>;
