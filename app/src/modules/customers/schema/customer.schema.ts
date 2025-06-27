import { z } from 'zod';

// Schema para dirección
export const addressSchema = z.object({
  name: z.string().min(1, 'El nombre de la dirección es requerido').max(100),
  street: z.string().min(1, 'La calle es requerida'),
  number: z.string().min(1, 'El número es requerido'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'La colonia es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  state: z.string().min(1, 'El estado es requerido'),
  zipCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  deliveryInstructions: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geocodedAddress: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Schema para crear cliente
export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  whatsappPhoneNumber: z
    .string()
    .min(1, 'El número de WhatsApp es requerido'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .optional()
    .or(z.literal('')),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  addresses: z.array(addressSchema).optional(),
});

// Schema para actualizar cliente
export const updateCustomerSchema = createCustomerSchema.partial();

// Schema para formularios
export const customerFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  whatsappPhoneNumber: z
    .string()
    .min(1, 'El número de WhatsApp es requerido'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .optional()
    .or(z.literal('')),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
  isBanned: z.boolean(),
  banReason: z.string().optional().or(z.literal('')),
});

// Types derivados de los schemas
export type AddressFormInputs = z.infer<typeof addressSchema>;
export type CustomerFormInputs = z.infer<typeof customerFormSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
