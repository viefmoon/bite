import { z } from 'zod';

// Schemas moved from auth.types.ts
export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'El correo o nombre de usuario es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    role: z.enum(['admin', 'staff']),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const authEmailLoginDtoSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string(),
});
export type AuthEmailLoginDto = z.infer<typeof authEmailLoginDtoSchema>;

export const userSchema = z.object({
  id: z.string().uuid('El ID de usuario debe ser un UUID válido'), // Cambiado a string().uuid()
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
  email: z.string().email('Correo electrónico inválido'),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Solo se permiten letras, números y guiones bajos',
    ),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
});

export type RegisterFormInputs = z.infer<typeof registerSchema>;
