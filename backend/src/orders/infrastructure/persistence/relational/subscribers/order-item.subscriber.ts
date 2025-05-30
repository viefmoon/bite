// src/orders/infrastructure/persistence/relational/subscribers/order-item.subscriber.ts
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
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderItemHistoryEntity } from '../entities/order-item-history.entity';
import { classToPlain } from 'class-transformer';
import * as jsondiffpatch from 'jsondiffpatch';
import { OrderEntity } from '../entities/order.entity'; // Importar OrderEntity

@EventSubscriber()
export class OrderItemSubscriber
  implements EntitySubscriberInterface<OrderItemEntity>
{
  constructor(@InjectDataSource() readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return OrderItemEntity;
  }

  // Helper para obtener el ID del usuario que modificó la orden
  private async getChangedByFromOrder(
    orderId: string,
    manager: EntityManager,
  ): Promise<string | null> {
    // Intentar obtener la orden; podría no existir si se está eliminando en cascada,
    // aunque en nuestro caso OrderItem tiene FK a Order, así que debería existir.
    const order = await manager.findOne(OrderEntity, {
      where: { id: orderId },
    });
    // Asumimos que OrderEntity tiene userId que refleja el último en modificar o el creador
    return order ? order.userId : null;
  }

  async afterInsert(event: InsertEvent<OrderItemEntity>) {
    if (!event.entity) return;
    const changedBy = await this.getChangedByFromOrder(
      event.entity.orderId,
      event.manager,
    );
    await this.persistHistory(
      'INSERT',
      event.entity,
      null, // No diff for INSERT
      changedBy,
      event.manager,
    );
  }

  async afterUpdate(event: UpdateEvent<OrderItemEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const before = classToPlain(event.databaseEntity);
    const after = classToPlain(event.entity);

    delete before['updatedAt'];
    delete after['updatedAt'];
    // Considerar eliminar relaciones si es necesario para el diff
    // delete before['order']; delete after['order'];
    // delete before['product']; delete after['product'];
    // delete before['productVariant']; delete after['productVariant'];
    // delete before['modifiers']; delete after['modifiers'];

    const diff = jsondiffpatch.diff(before, after);

    if (!diff) {
      return;
    }

    const changedBy = await this.getChangedByFromOrder(
      (event.entity as OrderItemEntity).orderId,
      event.manager,
    );
    await this.persistHistory(
      'UPDATE',
      event.entity as OrderItemEntity,
      diff,
      changedBy,
      event.manager,
    );
  }

  async afterRemove(event: RemoveEvent<OrderItemEntity>) {
    if (!event.databaseEntity) return;
    // Intentar obtener quién modificó desde la orden asociada
    const changedBy = await this.getChangedByFromOrder(
      event.databaseEntity.orderId,
      event.manager,
    );
    await this.persistHistory(
      'DELETE',
      event.databaseEntity,
      null, // No diff for DELETE
      changedBy,
      event.manager,
    );
  }

  private async persistHistory(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    entity: OrderItemEntity,
    diff: jsondiffpatch.Delta | null,
    changedBy: string | null, // Puede ser null si no se encuentra la orden
    manager: EntityManager,
  ) {
    if (!changedBy) {
      console.warn(
        `OrderItemSubscriber: No se pudo determinar changedBy para la operación ${operation} en OrderItem ID ${entity.id} (Order ID: ${entity.orderId}). No se registrará historial.`,
      );
      // Considerar usar un ID por defecto o lanzar un error si es crítico
      // changedBy = 'SYSTEM_UNKNOWN';
      return; // O lanzar error
    }

    const historyRecord = manager.create(OrderItemHistoryEntity, {
      orderItemId: entity.id,
      orderId: entity.orderId, // Guardar orderId para facilitar consultas
      operation: operation,
      changedBy: changedBy,
      diff: diff ?? undefined, // Guardar null si no hay diff
      snapshot: classToPlain(entity), // Guardar el estado actual (o anterior para DELETE)
    });
    await manager.save(historyRecord);
  }
}
