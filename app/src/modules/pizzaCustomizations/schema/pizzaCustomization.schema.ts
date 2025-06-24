import { z } from 'zod';
import { CustomizationType } from '../types/pizzaCustomization.types';

export const pizzaCustomizationFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.nativeEnum(CustomizationType),
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
  type: z.nativeEnum(CustomizationType).optional(),
  isActive: z.boolean().optional(),
});

export type FindAllPizzaCustomizationsQuery = z.infer<
  typeof findAllPizzaCustomizationsQuerySchema
>;
