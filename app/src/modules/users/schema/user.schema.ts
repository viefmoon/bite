import { z } from 'zod';

// Enums
export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum RoleEnum {
  ADMIN = 1,
  MANAGER = 2,
  CASHIER = 3,
  WAITER = 4,
  KITCHEN = 5,
  DELIVERY = 6,
}

// Esquemas base
const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  })
  .optional()
  .nullable();

const roleSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const preparationScreenSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
  })
  .optional()
  .nullable();

// Esquema base de usuario con todas las propiedades
const userBaseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  username: z.string().min(1, 'El nombre de usuario es requerido'),
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
  preparationScreen: preparationScreenSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Esquema para crear usuario
export const createUserDtoSchema = z.object({
  email: z.string().email().nullable().optional(),
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  birthDate: z.string().nullable().optional(),
  gender: z.nativeEnum(GenderEnum).nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  emergencyContact: emergencyContactSchema,
  role: z.object({
    id: z.number(),
  }),
});

// Esquema para actualizar usuario (todos los campos opcionales excepto validaciones específicas)
export const updateUserDtoSchema = userBaseSchema
  .omit({ id: true, createdAt: true, updatedAt: true, preparationScreen: true })
  .extend({
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .optional(),
    role: z
      .object({
        id: z.number(),
      })
      .optional(),
  })
  .partial();

// Esquema para consultas de usuarios
export const usersQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  filters: z
    .object({
      isActive: z.boolean().optional(),
      roles: z.array(z.object({ id: z.number() })).optional(),
    })
    .optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
});

// Esquema para respuesta de usuarios
export const usersResponseSchema = z.object({
  data: z.array(userBaseSchema),
  hasNextPage: z.boolean(),
});

// Exportar tipos inferidos
export type User = z.infer<typeof userBaseSchema>;
export type Role = z.infer<typeof roleSchema>;
export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof updateUserDtoSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;

// Los enums ya están exportados arriba
