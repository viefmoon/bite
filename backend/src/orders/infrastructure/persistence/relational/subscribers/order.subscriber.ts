import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { OrderEntity } from '../entities/order.entity';
import { UserContextService } from '../../../../../common/services/user-context.service';
import { Inject } from '@nestjs/common';
import { OrderChangeTrackerV2Service } from '../../../../services/order-change-tracker-v2.service';

@EventSubscriber()
export class OrderSubscriber implements EntitySubscriberInterface<OrderEntity> {
  private changeTracker: OrderChangeTrackerV2Service;
  private beforeUpdateCache = new Map<string, OrderEntity>();

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @Inject(UserContextService)
    private readonly userContextService: UserContextService,
  ) {
    dataSource.subscribers.push(this);
    // Inicializar el servicio manualmente
    this.changeTracker = new OrderChangeTrackerV2Service();
  }

  listenTo() {
    return OrderEntity;
  }

  async beforeUpdate(event: UpdateEvent<OrderEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    // IMPORTANTE: Usar una nueva query runner para obtener el estado ACTUAL de la BD
    // sin los cambios de la transacción en curso
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // Cargar la orden completa con todas sus relaciones ANTES del update
      const fullOrder = await queryRunner.manager.findOne(OrderEntity, {
        where: { id: event.databaseEntity.id },
        relations: [
          'orderItems',
          'orderItems.product',
          'orderItems.productVariant',
          'orderItems.productModifiers',
          'orderItems.selectedPizzaCustomizations',
          'orderItems.selectedPizzaCustomizations.pizzaCustomization',
          'table',
          'customer',
          'customer.addresses',
          'deliveryInfo',
        ],
      });

      if (fullOrder) {
        this.beforeUpdateCache.set(fullOrder.id, fullOrder);
      }
    } finally {
      await queryRunner.release();
    }
  }

  afterInsert(): void {
    // Nota: En INSERT, NO registramos el historial aquí porque los items
    // aún no han sido creados. El historial se registrará cuando se actualice
    // la orden o desde el servicio después de crear todos los items.
    return; // Asegurar que no continúa
  }

  afterUpdate(event: UpdateEvent<OrderEntity>): void {
    if (!event.entity) return;

    const orderId = event.entity.id;
    const previousState = this.beforeUpdateCache.get(orderId);

    if (!previousState) {
      return;
    }

    // Limpiar el cache
    this.beforeUpdateCache.delete(orderId);

    // Usar setTimeout para asegurar que la transacción se complete
    setTimeout(async () => {
      // Crear una nueva conexión para leer el estado ACTUAL después de la transacción
      const queryRunner = this.dataSource.createQueryRunner();

      try {
        await queryRunner.connect();

        const currentOrder = await queryRunner.manager.findOne(OrderEntity, {
          where: { id: orderId },
          relations: [
            'orderItems',
            'orderItems.product',
            'orderItems.productVariant',
            'orderItems.productModifiers',
            'orderItems.selectedPizzaCustomizations',
            'orderItems.selectedPizzaCustomizations.pizzaCustomization',
            'table',
            'customer',
            'customer.addresses',
            'deliveryInfo',
          ],
        });

        if (!currentOrder) {
          return;
        }

        const currentUser = this.userContextService.getCurrentUser();
        const changedBy =
          currentUser?.userId || currentOrder.userId || 'system';

        await this.changeTracker.trackOrderWithItems(
          'UPDATE',
          currentOrder,
          previousState,
          changedBy,
          queryRunner.manager,
        );
      } finally {
        await queryRunner.release();
      }
    }, 100); // Esperar 100ms para asegurar que la transacción se complete
  }

  async afterRemove(event: RemoveEvent<OrderEntity>) {
    if (!event.databaseEntity) return;

    const currentUser = this.userContextService.getCurrentUser();
    const changedBy =
      currentUser?.userId || event.databaseEntity.userId || 'system';

    await this.changeTracker.trackOrderWithItems(
      'DELETE',
      event.databaseEntity,
      null,
      changedBy,
      event.manager,
    );
  }
}
