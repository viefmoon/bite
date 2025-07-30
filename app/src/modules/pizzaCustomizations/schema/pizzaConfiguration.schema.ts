import { z } from 'zod';

// Esquema principal para PizzaConfiguration
export const pizzaConfigurationSchema = z.object({
  id: z.string(),
  productId: z.string(),
  includedToppings: z.number(),
  extraToppingCost: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PizzaConfiguration = z.infer<typeof pizzaConfigurationSchema>;

// Esquemas para formularios
export const pizzaConfigurationFormSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  includedToppings: z
    .number()
    .min(0, 'Los toppings incluidos deben ser mayor o igual a 0')
    .default(4),
  extraToppingCost: z
    .number()
    .min(0, 'El costo extra debe ser mayor o igual a 0')
    .default(20),
});

export type PizzaConfigurationFormInputs = z.infer<
  typeof pizzaConfigurationFormSchema
>;

export const updatePizzaConfigurationSchema = z.object({
  includedToppings: z.number().min(0).optional(),
  extraToppingCost: z.number().min(0).optional(),
});

export type UpdatePizzaConfigurationInputs = z.infer<
  typeof updatePizzaConfigurationSchema
>;
