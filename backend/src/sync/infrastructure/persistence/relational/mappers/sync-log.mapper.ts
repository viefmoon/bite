import { SyncLog } from '../../../../domain/sync-log';
import { SyncLogEntity } from '../entities/sync-log.entity';

export class SyncLogMapper {
  static toDomain(raw: SyncLogEntity): SyncLog {
    const domainEntity = new SyncLog();
    domainEntity.id = raw.id;
    domainEntity.syncType = raw.syncType;
    domainEntity.status = raw.status;
    domainEntity.itemsSynced = raw.itemsSynced;
    domainEntity.itemsFailed = raw.itemsFailed;
    domainEntity.errors = raw.errors;
    domainEntity.startedAt = raw.startedAt;
    domainEntity.completedAt = raw.completedAt;
    domainEntity.duration = raw.duration;
    domainEntity.metadata = raw.metadata;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: SyncLog): SyncLogEntity {
    const persistenceEntity = new SyncLogEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.syncType = domainEntity.syncType;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.itemsSynced = domainEntity.itemsSynced;
    persistenceEntity.itemsFailed = domainEntity.itemsFailed;
    persistenceEntity.errors = domainEntity.errors;
    persistenceEntity.startedAt = domainEntity.startedAt;
    persistenceEntity.completedAt = domainEntity.completedAt;
    persistenceEntity.duration = domainEntity.duration;
    persistenceEntity.metadata = domainEntity.metadata;

    return persistenceEntity;
  }
}
