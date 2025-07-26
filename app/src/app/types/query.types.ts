import { z } from 'zod';

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
});

export type BaseListQuery = z.infer<typeof baseListQuerySchema>;
