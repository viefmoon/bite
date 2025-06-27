import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncLogRepository } from '../infrastructure/persistence/sync-log.repository';
import { SyncLog, SyncStatus, SyncType } from '../domain/sync-log';

export interface SyncStatusInfo {
  isCurrentlySyncing: boolean;
  isConfigured: boolean;
  remoteUrl?: string;
  lastSync: {
    type: SyncType;
    status: SyncStatus;
    completedAt: Date | null;
    itemsSynced: number;
    itemsFailed: number;
    duration: number | null;
  } | null;
  syncHistory: SyncLog[];
  errors: any[] | null;
}

@Injectable()
export class SyncStatusService {
  private currentSyncLog: SyncLog | null = null;
  private isSyncing = false;

  constructor(
    @Inject('SYNC_LOG_REPOSITORY')
    private readonly syncLogRepository: SyncLogRepository,
    private readonly configService: ConfigService,
  ) {}

  async startSync(
    syncType: SyncType,
    metadata?: Record<string, any>,
  ): Promise<SyncLog> {
    this.isSyncing = true;

    const syncLog = await this.syncLogRepository.create({
      syncType,
      status: SyncStatus.IN_PROGRESS,
      itemsSynced: 0,
      itemsFailed: 0,
      errors: null,
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      metadata: metadata || null,
    });

    this.currentSyncLog = syncLog;
    return syncLog;
  }

  async completeSync(
    syncLogId: string,
    itemsSynced: number,
    itemsFailed: number,
    errors?: Record<string, any>,
  ): Promise<SyncLog | null> {
    const syncLog = await this.syncLogRepository.findById(syncLogId);
    if (!syncLog) return null;

    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - syncLog.startedAt.getTime()) / 1000,
    );

    const status =
      itemsFailed === 0
        ? SyncStatus.COMPLETED
        : itemsSynced > 0
          ? SyncStatus.PARTIAL
          : SyncStatus.FAILED;

    const updatedLog = await this.syncLogRepository.update(syncLogId, {
      status,
      itemsSynced,
      itemsFailed,
      errors,
      completedAt,
      duration,
    });

    this.isSyncing = false;
    this.currentSyncLog = null;

    return updatedLog;
  }

  async failSync(syncLogId: string, error: any): Promise<SyncLog | null> {
    const syncLog = await this.syncLogRepository.findById(syncLogId);
    if (!syncLog) return null;

    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - syncLog.startedAt.getTime()) / 1000,
    );

    const updatedLog = await this.syncLogRepository.update(syncLogId, {
      status: SyncStatus.FAILED,
      errors: { error: error.message || error },
      completedAt,
      duration,
    });

    this.isSyncing = false;
    this.currentSyncLog = null;

    return updatedLog;
  }

  async getStatus(): Promise<SyncStatusInfo> {
    const lastSync = await this.syncLogRepository.findLatestByType(
      SyncType.FULL,
    );
    const { data: syncHistory } = await this.syncLogRepository.findAll({
      limit: 10,
    });

    // Obtener configuración de sincronización
    const syncEnabled =
      this.configService.get<boolean>('sync.enabled', { infer: true }) || false;
    const cloudApiUrl =
      this.configService.get<string>('sync.cloudApiUrl', { infer: true }) ||
      '';
    const cloudApiKey =
      this.configService.get<string>('sync.cloudApiKey', { infer: true }) ||
      '';

    const isConfigured = syncEnabled && !!cloudApiUrl && !!cloudApiKey;

    return {
      isCurrentlySyncing: this.isSyncing,
      isConfigured,
      remoteUrl: isConfigured ? cloudApiUrl : undefined,
      lastSync: lastSync
        ? {
            type: lastSync.syncType,
            status: lastSync.status,
            completedAt: lastSync.completedAt,
            itemsSynced: lastSync.itemsSynced,
            itemsFailed: lastSync.itemsFailed,
            duration: lastSync.duration,
          }
        : null,
      syncHistory,
      errors: lastSync?.errors ? [lastSync.errors] : null,
    };
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  getCurrentSyncLog(): SyncLog | null {
    return this.currentSyncLog;
  }
}
