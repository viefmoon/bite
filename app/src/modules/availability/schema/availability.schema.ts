import { z } from 'zod';

const availabilityBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
});

export const categoryAvailabilitySchema = availabilityBaseSchema.extend({
  subcategories: z.array(z.lazy(() => subcategoryAvailabilitySchema)),
});

export const subcategoryAvailabilitySchema = availabilityBaseSchema.extend({
  categoryId: z.string().uuid(),
  products: z.array(z.lazy(() => productAvailabilitySchema)),
});

export const productAvailabilitySchema = availabilityBaseSchema.extend({
  subcategoryId: z.string().uuid(),
  modifierGroups: z
    .array(z.lazy(() => modifierGroupAvailabilitySchema))
    .optional(),
});

export const modifierGroupAvailabilitySchema = availabilityBaseSchema.extend({
  modifiers: z.array(z.lazy(() => modifierAvailabilitySchema)),
});

export const modifierAvailabilitySchema = availabilityBaseSchema.extend({
  modifierGroupId: z.string().uuid(),
});

export const pizzaCustomizationAvailabilitySchema =
  availabilityBaseSchema.extend({
    type: z.enum(['FLAVOR', 'INGREDIENT']),
    sortOrder: z.number(),
  });

export const pizzaCustomizationGroupAvailabilitySchema = z.object({
  type: z.string(),
  items: z.array(pizzaCustomizationAvailabilitySchema),
});

export const availabilityUpdatePayloadSchema = z.object({
  type: z.enum([
    'category',
    'subcategory',
    'product',
    'modifierGroup',
    'modifier',
    'pizzaCustomization',
  ]),
  id: z.string().uuid(),
  isActive: z.boolean(),
  cascade: z.boolean().optional(),
});


export type CategoryAvailability = z.infer<typeof categoryAvailabilitySchema>;
export type SubcategoryAvailability = z.infer<
  typeof subcategoryAvailabilitySchema
>;
export type ProductAvailability = z.infer<typeof productAvailabilitySchema>;
export type ModifierGroupAvailability = z.infer<
  typeof modifierGroupAvailabilitySchema
>;
export type ModifierAvailability = z.infer<typeof modifierAvailabilitySchema>;
export type PizzaCustomizationAvailability = z.infer<
  typeof pizzaCustomizationAvailabilitySchema
>;
export type PizzaCustomizationGroupAvailability = z.infer<
  typeof pizzaCustomizationGroupAvailabilitySchema
>;
export type AvailabilityUpdatePayload = z.infer<
  typeof availabilityUpdatePayloadSchema
>;
