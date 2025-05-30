import { Injectable, Inject } from '@nestjs/common';
import { OrderItemHistoryRepository } from './infrastructure/persistence/order-item-history.repository';
import { UsersService } from '../users/users.service';
import { ORDER_ITEM_HISTORY_REPOSITORY } from '../common/tokens';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { OrderItemHistoryEntity } from './infrastructure/persistence/relational/entities/order-item-history.entity';
import { User } from '../users/domain/user';

export class EnrichedOrderItemHistoryDto extends OrderItemHistoryEntity {
  changedByUser?: Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'username'
  > | null;
}

@Injectable()
export class OrderItemChangeLogService {
  constructor(
    @Inject(ORDER_ITEM_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderItemHistoryRepository,
    private readonly usersService: UsersService,
  ) {}

  private async enrichLogs(
    logs: OrderItemHistoryEntity[],
  ): Promise<EnrichedOrderItemHistoryDto[]> {
    if (logs.length === 0) {
      return [];
    }

    const userIds = [...new Set(logs.map((log) => log.changedBy))].filter(
      (id): id is string => !!id,
    );

    let userMap = new Map<
      string,
      Pick<User, 'id' | 'firstName' | 'lastName' | 'username'>
    >();
    if (userIds.length > 0) {
      try {
        const users = await this.usersService.findByIds(userIds);
        userMap = new Map(
          users.map((u) => [
            u.id,
            {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              username: u.username,
            },
          ]),
        );
      } catch (error) {
        console.error(
          'Error fetching users for item history enrichment:',
          error,
        );
      }
    }

    return logs.map((log) => {
      const user = log.changedBy ? userMap.get(log.changedBy) : null;
      const enrichedLog = new EnrichedOrderItemHistoryDto();
      Object.assign(enrichedLog, log);
      enrichedLog.changedByUser = user || null;
      return enrichedLog;
    });
  }

  async findByOrderItemId(
    orderItemId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[EnrichedOrderItemHistoryDto[], number]> {
    const [logs, totalCount] = await this.historyRepository.findByOrderItemId(
      orderItemId,
      paginationOptions,
    );
    const enrichedLogs = await this.enrichLogs(logs);
    return [enrichedLogs, totalCount];
  }

  async findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[EnrichedOrderItemHistoryDto[], number]> {
    const [logs, totalCount] = await this.historyRepository.findByOrderId(
      orderId,
      paginationOptions,
    );
    const enrichedLogs = await this.enrichLogs(logs);
    return [enrichedLogs, totalCount];
  }
}
