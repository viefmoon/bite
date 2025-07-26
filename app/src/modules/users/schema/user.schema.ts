import { z } from 'zod';
import {
  userSchema as domainUserSchema,
  emergencyContactSchema,
  GenderEnum,
  RoleEnum,
  type User,
  type Role,
} from '@/app/schemas/domain/user.schema';

// Re-exportar tipos de dominio
export type { User, Role };
export { GenderEnum, RoleEnum };

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
export const updateUserDtoSchema = domainUserSchema
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
  data: z.array(domainUserSchema),
  hasNextPage: z.boolean(),
});

// Exportar tipos inferidos
export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof updateUserDtoSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
