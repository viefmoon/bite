import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLogEntity } from '../entities/sync-log.entity';
import { SyncLogRepository } from '../../sync-log.repository';
import { SyncLog } from '../../../../domain/sync-log';
import { SyncLogMapper } from '../mappers/sync-log.mapper';

@Injectable()
export class RelationalSyncLogRepository implements SyncLogRepository {
  constructor(
    @InjectRepository(SyncLogEntity)
    private readonly syncLogRepository: Repository<SyncLogEntity>,
  ) {}

  async create(
    data: Omit<SyncLog, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SyncLog> {
    const persistenceModel = SyncLogMapper.toPersistence(data as SyncLog);
    const newEntity = await this.syncLogRepository.save(
      this.syncLogRepository.create(persistenceModel),
    );
    return SyncLogMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<SyncLog | null> {
    const entity = await this.syncLogRepository.findOne({
      where: { id },
    });

    return entity ? SyncLogMapper.toDomain(entity) : null;
  }

  async update(id: string, data: Partial<SyncLog>): Promise<SyncLog | null> {
    await this.syncLogRepository.update(id, data);

    const updatedEntity = await this.syncLogRepository.findOne({
      where: { id },
    });

    return updatedEntity ? SyncLogMapper.toDomain(updatedEntity) : null;
  }

  async findLatestByType(syncType: string): Promise<SyncLog | null> {
    const entity = await this.syncLogRepository.findOne({
      where: { syncType: syncType as any },
      order: { createdAt: 'DESC' },
    });

    return entity ? SyncLogMapper.toDomain(entity) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    syncType?: string;
    status?: string;
  }): Promise<{ data: SyncLog[]; count: number }> {
    const query = this.syncLogRepository.createQueryBuilder('sync_log');

    if (options?.syncType) {
      query.andWhere('sync_log.syncType = :syncType', {
        syncType: options.syncType,
      });
    }

    if (options?.status) {
      query.andWhere('sync_log.status = :status', { status: options.status });
    }

    query.orderBy('sync_log.createdAt', 'DESC');

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    const [entities, count] = await query.getManyAndCount();

    return {
      data: entities.map((entity) => SyncLogMapper.toDomain(entity)),
      count,
    };
  }
}
