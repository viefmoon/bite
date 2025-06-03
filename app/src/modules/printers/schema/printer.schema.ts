import { z } from "zod";
import { baseListQuerySchema } from "../../../app/types/query.types";

export const PrinterConnectionTypeSchema = z.enum([
  "NETWORK",
  "USB",
  "SERIAL",
  "BLUETOOTH",
]);
export type PrinterConnectionType = z.infer<typeof PrinterConnectionTypeSchema>;

const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/i;

export const thermalPrinterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  connectionType: PrinterConnectionTypeSchema,
  ipAddress: z.string().ip({ version: "v4" }).nullable(),
  port: z.number().int().positive().nullable(),
  path: z.string().nullable(),
  isActive: z.boolean(),
  macAddress: z.string().regex(macRegex, "MAC inválida").nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type ThermalPrinter = z.infer<typeof thermalPrinterSchema>;

const thermalPrinterDtoObjectSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  connectionType: PrinterConnectionTypeSchema,
  ipAddress: z.string().ip({ version: "v4", message: "IP inválida" }).optional(),
  port: z.coerce.number().int().positive("Puerto inválido").optional(),
  path: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  macAddress: z.string().regex(macRegex, "MAC inválida").optional(),
});

const refinePrinterDto = (
  data: Partial<z.infer<typeof thermalPrinterDtoObjectSchema>>,
  ctx: z.RefinementCtx
) => {
  if (data.connectionType === undefined) return;

  if (data.connectionType === "NETWORK") {
    if (!data.ipAddress) {
      ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La dirección IP es requerida para conexión NETWORK",
          path: ["ipAddress"],
        });
      }
      if (!data.port) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El puerto es requerido para conexión NETWORK",
          path: ["port"],
        });
      }
      if (data.path !== undefined && data.path !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
           message: "La ruta debe estar vacía para conexión NETWORK",
           path: ["path"],
         });
      }
    } else {
      if (!data.path) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La ruta/identificador es requerido para este tipo de conexión",
          path: ["path"],
        });
      }
      if (data.ipAddress !== undefined && data.ipAddress !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
           message: "La IP debe estar vacía para este tipo de conexión",
           path: ["ipAddress"],
         });
      }
      if (data.port !== undefined && data.port !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
           message: "El puerto debe estar vacío para este tipo de conexión",
           path: ["port"],
         });
      }
    }
  };

export const createThermalPrinterDtoSchema = thermalPrinterDtoObjectSchema.superRefine(refinePrinterDto);

export type CreateThermalPrinterDto = z.infer<
  typeof createThermalPrinterDtoSchema
>;

export const updateThermalPrinterDtoSchema = thermalPrinterDtoObjectSchema.partial().superRefine(refinePrinterDto);

export type UpdateThermalPrinterDto = z.infer<
  typeof updateThermalPrinterDtoSchema
>;

export const findAllThermalPrintersFilterSchema = baseListQuerySchema.extend({
  name: z.string().optional(),
  connectionType: PrinterConnectionTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type FindAllThermalPrintersDto = z.infer<
  typeof findAllThermalPrintersFilterSchema
>;

export const printerFormSchema = createThermalPrinterDtoSchema;
export type PrinterFormData = z.input<typeof printerFormSchema>;

export const discoveredPrinterSchema = z.object({
  ip: z.string().ip({ version: "v4" }),
  port: z.number().int().positive(),
  name: z.string().optional(),
  model: z.string().optional(),
  type: z.string(),
  mac: z.string().regex(macRegex, "MAC inválida").optional(),
});

export type DiscoveredPrinter = z.infer<typeof discoveredPrinterSchema>;