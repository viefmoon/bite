import { z } from 'zod';

// Enums - CORREGIDOS según backend
export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say', // FALTANTE en frontend
}

export enum RoleEnum {
  ADMIN = 1,
  MANAGER = 2,
  CASHIER = 3,
  WAITER = 4,
  KITCHEN = 5,
  DELIVERY = 6,
}

// Esquema para contacto de emergencia
export const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  })
  .optional()
  .nullable();

// Esquema para rol
export const roleSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

// Esquema para pantalla de preparación
export const userPreparationScreenSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
  })
  .optional()
  .nullable();

// Esquema principal del usuario
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().optional(), // Campo del backend
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.nativeEnum(GenderEnum).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  emergencyContact: emergencyContactSchema,
  isActive: z.boolean(),
  role: roleSchema.optional(),
  preparationScreen: userPreparationScreenSchema,
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
  deletedAt: z.union([z.string().datetime(), z.date()]).nullable().optional(),
});

// Tipos TypeScript inferidos y exportados centralmente
export type User = z.infer<typeof userSchema>;
export type Role = z.infer<typeof roleSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type UserPreparationScreen = z.infer<typeof userPreparationScreenSchema>;
