import { z } from 'zod';

// Enums
export const syncActivityTypeSchema = z.enum([
  'PULL_CHANGES',
  'RESTAURANT_DATA',
  'ORDER_STATUS',
]);
export const syncDirectionSchema = z.enum(['IN', 'OUT']);

export type SyncActivityType = z.infer<typeof syncActivityTypeSchema>;
export type SyncDirection = z.infer<typeof syncDirectionSchema>;

// Exportar los valores de los enums para uso en runtime
export const SyncActivityTypeEnum = syncActivityTypeSchema.enum;
export const SyncDirectionEnum = syncDirectionSchema.enum;

// Esquema para SyncActivity
export const syncActivitySchema = z.object({
  id: z.string(),
  type: syncActivityTypeSchema,
  direction: syncDirectionSchema,
  success: z.boolean(),
  timestamp: z.string(),
});

export type SyncActivity = z.infer<typeof syncActivitySchema>;

// Esquema para SyncStatus
export const syncStatusSchema = z.object({
  enabled: z.boolean(),
  webSocketEnabled: z.boolean(),
  webSocketConnected: z.boolean().optional(),
  webSocketFailed: z.boolean().optional(),
  remoteUrl: z.string().nullable(),
  mode: z.string(),
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;

// Mapeo de tipos para mostrar en la UI
export const SYNC_TYPE_LABELS: Record<SyncActivityType, string> = {
  [SyncActivityTypeEnum.PULL_CHANGES]: 'Órdenes y Clientes',
  [SyncActivityTypeEnum.RESTAURANT_DATA]: 'Menú y Configuración',
  [SyncActivityTypeEnum.ORDER_STATUS]: 'Estado de Orden',
};

export const SYNC_DIRECTION_LABELS: Record<SyncDirection, string> = {
  [SyncDirectionEnum.IN]: 'Desde la nube',
  [SyncDirectionEnum.OUT]: 'Hacia la nube',
};
