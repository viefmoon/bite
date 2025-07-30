import { z } from 'zod';

// Schema base para dirección
export const addressBaseSchema = z.object({
  name: z.string().min(1, 'El nombre de la dirección es requerido').max(100),
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  interiorNumber: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional().default('México'),
  deliveryInstructions: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
});

export const addressSchema = addressBaseSchema;

// Schema base para cliente con campos comunes
export const customerBaseSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  whatsappPhoneNumber: z.string().min(1, 'El número de WhatsApp es requerido'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
});

// Schema para crear cliente - derivado del base
export const createCustomerSchema = customerBaseSchema.extend({
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  addresses: z.array(addressBaseSchema).optional(),
});

// Schema para actualizar cliente - derivado del base con todos los campos opcionales
export const updateCustomerSchema = customerBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  addresses: z.array(addressBaseSchema).optional(),
});

// Schema para formularios - derivado del schema de creación con campos adicionales para UI
export const customerFormSchema = createCustomerSchema.extend({
  isActive: z.boolean().default(true),
  isBanned: z.boolean().default(false),
  banReason: z.string().optional().or(z.literal('')),
});

// Types derivados de los schemas
export type AddressFormInputs = z.infer<typeof addressSchema>;
export type CustomerFormInputs = z.infer<typeof customerFormSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// Schema completo para Address - derivado del base
export const addressEntitySchema = addressBaseSchema.extend({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type Address = z.infer<typeof addressEntitySchema>;

// Schema completo para Customer - derivado del base con campos adicionales
export const customerEntitySchema = customerBaseSchema
  .omit({ email: true, birthDate: true })
  .extend({
    id: z.string().uuid(),
    email: z.string().email().nullable().optional(),
    birthDate: z.date().nullable().optional(),
    stripeCustomerId: z.string().nullable().optional(),
    lastInteraction: z.date().nullable().optional(),
    totalOrders: z.number().int().nonnegative(),
    totalSpent: z.number().nonnegative(),
    isActive: z.boolean(),
    isBanned: z.boolean(),
    bannedAt: z.date().nullable().optional(),
    banReason: z.string().nullable().optional(),
    whatsappMessageCount: z.number().int().nonnegative(),
    lastWhatsappMessageTime: z.date().nullable().optional(),
    addresses: z.array(addressEntitySchema),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable().optional(),
  });

export type Customer = z.infer<typeof customerEntitySchema>;

// Schema para FindAllCustomersQuery - derivado del base con campos de paginación
export const findAllCustomersQuerySchema = customerBaseSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    whatsappPhoneNumber: true,
  })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    isBanned: z.boolean().optional(),
    lastInteractionAfter: z.date().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  });

export type FindAllCustomersQuery = z.infer<typeof findAllCustomersQuerySchema>;
