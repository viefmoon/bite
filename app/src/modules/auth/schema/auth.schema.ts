import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'El correo o nombre de usuario es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const authEmailLoginDtoSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string(),
});
export type AuthEmailLoginDto = z.infer<typeof authEmailLoginDtoSchema>;

export const userSchema = z.object({
  id: z.string().uuid('El ID de usuario debe ser un UUID válido'),
  email: z.string().email().nullable(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  preparationScreen: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      isActive: z.boolean(),
    })
    .nullable()
    .optional(),
});
export type User = z.infer<typeof userSchema>;

export const loginResponseDtoSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  tokenExpires: z.number(),
  user: userSchema,
});
export type LoginResponseDto = z.infer<typeof loginResponseDtoSchema>;

export const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido').optional(),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guión bajo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  phoneNumber: z
    .union([
      z.string().regex(/^\+?[0-9\s-]+$/, 'Número de teléfono inválido'),
      z.literal(''),
    ])
    .optional(),
  role: z.number(),
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;
