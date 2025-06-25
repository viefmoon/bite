import { SyncLog } from '../../domain/sync-log';

export abstract class SyncLogRepository {
  abstract create(
    data: Omit<SyncLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SyncLog>;
  abstract findById(id: string): Promise<SyncLog | null>;
  abstract update(id: string, data: Partial<SyncLog>): Promise<SyncLog | null>;
  abstract findLatestByType(syncType: string): Promise<SyncLog | null>;
  abstract findAll(options?: {
    limit?: number;
    offset?: number;
    syncType?: string;
    status?: string;
  }): Promise<{ data: SyncLog[]; count: number }>;
}
