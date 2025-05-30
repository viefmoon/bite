import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
  EntityManager,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderHistoryEntity } from '../entities/order-history.entity';
import { classToPlain } from 'class-transformer';
import * as jsondiffpatch from 'jsondiffpatch';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<OrderEntity> {
  constructor(@InjectDataSource() readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return OrderEntity;
  }

  async afterInsert(event: InsertEvent<OrderEntity>) {
    if (!event.entity) return;
    const changedBy = event.entity.userId;
    await this.persistHistory(
      'INSERT',
      event.entity,
      null,
      changedBy,
      event.manager,
    );
  }

  async afterUpdate(event: UpdateEvent<OrderEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const before = classToPlain(event.databaseEntity);
    const after = classToPlain(event.entity);

    delete before['updatedAt'];
    delete after['updatedAt'];

    const diff = jsondiffpatch.diff(before, after);

    if (!diff) {
      return;
    }

    const changedBy = (event.entity as OrderEntity).userId;
    await this.persistHistory(
      'UPDATE',
      event.entity as OrderEntity,
      diff,
      changedBy,
      event.manager,
    );
  }

  async afterRemove(event: RemoveEvent<OrderEntity>) {
    if (!event.databaseEntity) return;
    const changedBy = event.databaseEntity.userId;
    await this.persistHistory(
      'DELETE',
      event.databaseEntity,
      null,
      changedBy,
      event.manager,
    );
  }

  private async persistHistory(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    entity: OrderEntity,
    diff: jsondiffpatch.Delta | null,
    changedBy: string,
    manager: EntityManager,
  ) {
    if (!changedBy) {
      console.warn(
        `OrderSubscriber: No se pudo determinar changedBy para la operación ${operation} en Order ID ${entity.id}. No se registrará historial.`,
      );
      return;
    }

    const historyRecord = manager.create(OrderHistoryEntity, {
      orderId: entity.id,
      operation: operation,
      changedBy: changedBy,
      diff: diff ?? undefined,
      snapshot: classToPlain(entity),
    });
    await manager.save(historyRecord);
  }
}
