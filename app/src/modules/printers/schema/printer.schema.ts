import { z } from 'zod';
import { baseListQuerySchema } from '../../../app/types/query.types';

export const PrinterConnectionTypeSchema = z.enum([
  'NETWORK',
  'USB',
  'SERIAL',
  'BLUETOOTH',
]);
export type PrinterConnectionType = z.infer<typeof PrinterConnectionTypeSchema>;

const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/i;

// Schema completo para entidad ThermalPrinter - derivado del base con campos adicionales
export const thermalPrinterSchema = printerBaseSchema
  .omit({
    ipAddress: true,
    port: true,
    path: true,
    macAddress: true,
  })
  .extend({
    id: z.string().uuid(),
    ipAddress: z.string().ip({ version: 'v4' }).nullable(),
    port: z.number().int().positive().nullable(),
    path: z.string().nullable(),
    macAddress: z
      .string()
      .regex(macRegex, 'MAC inválida')
      .nullable()
      .optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    deletedAt: z.string().datetime().nullable().optional(),
  });

export type ThermalPrinter = z.infer<typeof thermalPrinterSchema>;

// Schema base para printer con campos comunes
const printerBaseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  connectionType: PrinterConnectionTypeSchema,
  ipAddress: z
    .string()
    .ip({ version: 'v4', message: 'IP inválida' })
    .optional(),
  port: z.coerce
    .number()
    .int()
    .positive('El puerto debe ser un número positivo')
    .optional(),
  path: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  macAddress: z.string().regex(macRegex, 'MAC inválida').optional(),
  isDefaultPrinter: z.boolean().optional().default(false),
  autoDeliveryPrint: z.boolean().optional().default(false),
  autoPickupPrint: z.boolean().optional().default(false),
  paperWidth: z
    .number()
    .min(58, 'El ancho del papel debe ser de al menos 58mm')
    .optional()
    .default(80),
  charactersPerLine: z
    .number()
    .min(32, 'Debe tener al menos 32 caracteres por línea')
    .optional()
    .default(48),
  cutPaper: z.boolean().optional().default(true),
  feedLines: z
    .number()
    .min(0, 'No puede ser menor a 0 líneas')
    .max(50, 'No puede ser mayor a 50 líneas')
    .optional()
    .default(3),
});

// Función helper para validación de conexión (reutilizable)
const refinePrinterDto = (
  data: Partial<z.infer<typeof printerBaseSchema>>,
  ctx: z.RefinementCtx,
) => {
  if (data.connectionType === undefined) return;

  if (data.connectionType === 'NETWORK') {
    if (!data.ipAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La dirección IP es requerida para conexión NETWORK',
        path: ['ipAddress'],
      });
    }
    if (!data.port) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El puerto es requerido para conexión NETWORK',
        path: ['port'],
      });
    }
    if (data.path !== undefined && data.path !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La ruta debe estar vacía para conexión NETWORK',
        path: ['path'],
      });
    }
  } else {
    if (!data.path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'La ruta/identificador es requerido para este tipo de conexión',
        path: ['path'],
      });
    }
    if (data.ipAddress !== undefined && data.ipAddress !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La IP debe estar vacía para este tipo de conexión',
        path: ['ipAddress'],
      });
    }
    if (data.port !== undefined && data.port !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El puerto debe estar vacío para este tipo de conexión',
        path: ['port'],
      });
    }
  }
};

// Schema para creación - derivado del base con validación
export const createThermalPrinterDtoSchema =
  printerBaseSchema.superRefine(refinePrinterDto);

export type CreateThermalPrinterDto = z.infer<
  typeof createThermalPrinterDtoSchema
>;

// Schema para actualización - derivado del base parcial con validación
export const updateThermalPrinterDtoSchema = printerBaseSchema
  .partial()
  .superRefine(refinePrinterDto);

export type UpdateThermalPrinterDto = z.infer<
  typeof updateThermalPrinterDtoSchema
>;

// Schema para filtros de búsqueda - derivado del base con campos específicos
export const findAllThermalPrintersFilterSchema = baseListQuerySchema.extend({
  name: z.string().optional(),
  connectionType: PrinterConnectionTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type FindAllThermalPrintersDto = z.infer<
  typeof findAllThermalPrintersFilterSchema
>;

// Schema para formulario - alias del schema de creación
export const printerFormSchema = createThermalPrinterDtoSchema;
export type PrinterFormData = z.input<typeof printerFormSchema>;

export const discoveredPrinterSchema = z.object({
  ip: z.string().ip({ version: 'v4' }),
  port: z.number().int().positive(),
  name: z.string().optional(),
  model: z.string().optional(),
  type: z.string(),
  mac: z.string().regex(macRegex, 'MAC inválida').optional(),
});

export type DiscoveredPrinter = z.infer<typeof discoveredPrinterSchema>;
