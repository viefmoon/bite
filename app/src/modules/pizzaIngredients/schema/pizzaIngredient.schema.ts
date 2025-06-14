import { z } from 'zod';

export const pizzaIngredientFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  ingredientValue: z.number().min(1, 'El valor debe ser mayor a 0'),
  ingredients: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
});

export type PizzaIngredientFormInputs = z.infer<
  typeof pizzaIngredientFormSchema
>;
