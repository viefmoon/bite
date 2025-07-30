import { z } from 'zod';

// Enums
export const customizationTypeSchema = z.enum(['FLAVOR', 'INGREDIENT']);
export const pizzaHalfSchema = z.enum(['FULL', 'HALF_1', 'HALF_2']);
export const customizationActionSchema = z.enum(['ADD', 'REMOVE']);

export type CustomizationType = z.infer<typeof customizationTypeSchema>;
export type PizzaHalf = z.infer<typeof pizzaHalfSchema>;
export type CustomizationAction = z.infer<typeof customizationActionSchema>;

// Exportar los valores de los enums para uso en runtime
export const CustomizationTypeEnum = customizationTypeSchema.enum;
export const PizzaHalfEnum = pizzaHalfSchema.enum;
export const CustomizationActionEnum = customizationActionSchema.enum;

// Esquema para PizzaCustomization
export const pizzaCustomizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: customizationTypeSchema,
  ingredients: z.string().nullable().optional(),
  toppingValue: z.number(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  productIds: z.array(z.string()).optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PizzaCustomization = z.infer<typeof pizzaCustomizationSchema>;

// Esquema para SelectedPizzaCustomization
export const selectedPizzaCustomizationSchema = z.object({
  id: z.string(),
  orderItemId: z.string(),
  pizzaCustomizationId: z.string(),
  pizzaCustomization: pizzaCustomizationSchema.optional(),
  half: pizzaHalfSchema,
  action: customizationActionSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SelectedPizzaCustomization = z.infer<
  typeof selectedPizzaCustomizationSchema
>;

// Tipo para customizaciones durante la edición (sin campos del backend)
export const pizzaCustomizationInputSchema = z.object({
  pizzaCustomizationId: z.string(),
  half: pizzaHalfSchema,
  action: customizationActionSchema,
});

export type PizzaCustomizationInput = z.infer<
  typeof pizzaCustomizationInputSchema
>;

// Esquemas para formularios
export const pizzaCustomizationFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: customizationTypeSchema,
  ingredients: z.string().optional().nullable(),
  toppingValue: z
    .number()
    .min(0, 'El valor debe ser mayor o igual a 0')
    .default(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export type PizzaCustomizationFormInputs = z.infer<
  typeof pizzaCustomizationFormSchema
>;

export const findAllPizzaCustomizationsQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  type: customizationTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type FindAllPizzaCustomizationsQuery = z.infer<
  typeof findAllPizzaCustomizationsQuerySchema
>;
