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
import { UserContextService } from '../../../../../common/services/user-context.service';
import { Inject } from '@nestjs/common';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<OrderEntity> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @Inject(UserContextService)
    private readonly userContextService: UserContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return OrderEntity;
  }

  async afterInsert(event: InsertEvent<OrderEntity>) {
    if (!event.entity) return;

    // Obtener el usuario del contexto o usar el userId de la orden
    const currentUser = this.userContextService.getCurrentUser();
    const changedBy = currentUser?.userId || event.entity.userId;

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

    const before = this.cleanEntityForComparison(
      classToPlain(event.databaseEntity),
    );
    const after = this.cleanEntityForComparison(classToPlain(event.entity));

    const diff = jsondiffpatch.diff(before, after);

    if (!diff) {
      return;
    }

    // Obtener el usuario del contexto o usar el userId de la orden
    const currentUser = this.userContextService.getCurrentUser();
    const changedBy =
      currentUser?.userId || (event.entity as OrderEntity).userId;

    // Limpiar el diff de campos no relevantes
    const cleanedDiff = this.cleanDiff(diff);

    // Si después de limpiar no quedan cambios reales, no guardar
    if (!cleanedDiff || Object.keys(cleanedDiff).length === 0) {
      return;
    }

    await this.persistHistory(
      'UPDATE',
      event.entity as OrderEntity,
      cleanedDiff,
      changedBy,
      event.manager,
    );
  }

  async afterRemove(event: RemoveEvent<OrderEntity>) {
    if (!event.databaseEntity) return;

    // Obtener el usuario del contexto o usar el userId de la orden
    const currentUser = this.userContextService.getCurrentUser();
    const changedBy = currentUser?.userId || event.databaseEntity.userId;

    await this.persistHistory(
      'DELETE',
      event.databaseEntity,
      null,
      changedBy,
      event.manager,
    );
  }

  private cleanEntityForComparison(entity: any): any {
    const cleaned = { ...entity };

    // Eliminar campos que no queremos comparar
    delete cleaned['updatedAt'];
    delete cleaned['createdAt'];
    delete cleaned['__entity'];

    // Si hay relaciones, solo mantener sus IDs
    if (cleaned['user'] && typeof cleaned['user'] === 'object') {
      cleaned['userId'] = cleaned['user'].id;
      delete cleaned['user'];
    }

    if (cleaned['table'] && typeof cleaned['table'] === 'object') {
      cleaned['tableId'] = cleaned['table'].id;
      delete cleaned['table'];
    }

    if (
      cleaned['dailyOrderCounter'] &&
      typeof cleaned['dailyOrderCounter'] === 'object'
    ) {
      cleaned['dailyOrderCounterId'] = cleaned['dailyOrderCounter'].id;
      delete cleaned['dailyOrderCounter'];
    }

    // Para orderItems, ordenar por productId para comparación consistente
    if (cleaned['orderItems'] && Array.isArray(cleaned['orderItems'])) {
      cleaned['orderItems'] = cleaned['orderItems']
        .map((item: any) => ({
          productId: item.productId || item.product?.id,
          productVariantId:
            item.productVariantId || item.productVariant?.id || null,
          basePrice: item.basePrice,
          finalPrice: item.finalPrice,
          preparationStatus: item.preparationStatus,
          preparationNotes: item.preparationNotes || null,
          // Incluir nombre del producto para mejor visualización
          product: item.product ? { name: item.product.name } : undefined,
          modifiers: item.modifiers
            ?.map((mod: any) => ({
              productModifierId: mod.productModifierId || mod.productModifier?.id,
              quantity: mod.quantity || 1,
              price: mod.price,
            }))
            .sort((a: any, b: any) => a.productModifierId.localeCompare(b.productModifierId)),
        }))
        // Ordenar items por productId para comparación consistente
        .sort((a: any, b: any) => {
          const aKey = `${a.productId}-${a.productVariantId || 'null'}`;
          const bKey = `${b.productId}-${b.productVariantId || 'null'}`;
          return aKey.localeCompare(bKey);
        });
    }

    // Convertir total a número si es string
    if (cleaned['total'] && typeof cleaned['total'] === 'string') {
      cleaned['total'] = parseFloat(cleaned['total']);
    }

    if (cleaned['subtotal'] && typeof cleaned['subtotal'] === 'string') {
      cleaned['subtotal'] = parseFloat(cleaned['subtotal']);
    }

    return cleaned;
  }

  private cleanDiff(diff: any): any {
    if (!diff || typeof diff !== 'object') return diff;

    const cleaned: any = {};

    // Lista de campos que queremos mantener en el historial
    const relevantFields = [
      'orderStatus',
      'orderType',
      'total',
      'subtotal',
      'notes',
      'tableId',
      'customerName',
      'phoneNumber',
      'deliveryAddress',
      'scheduledAt',
      'orderItems',
    ];

    for (const key of Object.keys(diff)) {
      // Solo incluir campos relevantes
      if (relevantFields.includes(key)) {
        // Para total y subtotal, verificar que realmente cambió el valor
        if (
          (key === 'total' || key === 'subtotal') &&
          Array.isArray(diff[key]) &&
          diff[key].length === 2
        ) {
          const [oldVal, newVal] = diff[key];
          // Comparar como números
          const oldNum =
            typeof oldVal === 'string' ? parseFloat(oldVal) : oldVal;
          const newNum =
            typeof newVal === 'string' ? parseFloat(newVal) : newVal;
          if (Math.abs(oldNum - newNum) > 0.01) {
            // Tolerancia para decimales
            cleaned[key] = [oldNum, newNum];
          }
        } else {
          cleaned[key] = diff[key];
        }
      }
    }

    return cleaned;
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
