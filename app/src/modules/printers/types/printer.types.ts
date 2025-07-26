import { z } from 'zod'; // Importar z para inferir tipos si es necesario
// Importar tipos y esquemas Zod desde el nuevo archivo
import {
  thermalPrinterSchema,
  createThermalPrinterDtoSchema,
  updateThermalPrinterDtoSchema,
  findAllThermalPrintersFilterSchema,
  discoveredPrinterSchema,
  PrinterConnectionTypeSchema,
} from '../schema/printer.schema';
import type { BaseListQueryDto } from '../../../app/types/api.types';

// Exportar tipos inferidos de Zod
export type ThermalPrinter = z.infer<typeof thermalPrinterSchema>;
export type CreateThermalPrinterDto = z.infer<
  typeof createThermalPrinterDtoSchema
>;
export type UpdateThermalPrinterDto = z.infer<
  typeof updateThermalPrinterDtoSchema
>;
export type FindAllThermalPrintersDto = z.infer<
  typeof findAllThermalPrintersFilterSchema
> &
  BaseListQueryDto; // Combinar con paginación base
export type DiscoveredPrinter = z.infer<typeof discoveredPrinterSchema>;
export type PrinterConnectionType = z.infer<typeof PrinterConnectionTypeSchema>;
