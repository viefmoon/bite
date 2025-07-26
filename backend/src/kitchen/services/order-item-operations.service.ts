import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderItemEntity } from '../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { PreparationStatus } from '../../orders/domain/order-item';
import { PreparationScreenStatus } from '../../orders/domain/order-preparation-screen-status';
import { ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY } from '../../common/tokens';
import { OrderPreparationScreenStatusRepository } from '../../orders/infrastructure/persistence/order-preparation-screen-status.repository';

@Injectable()
export class OrderItemOperationsService {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY)
    private readonly screenStatusRepository: OrderPreparationScreenStatusRepository,
  ) {}

  /**
   * Marca items como preparados o no preparados
   */
  async markItemPrepared(
    itemId: string,
    userId: string,
    isPrepared: boolean = true,
  ): Promise<void> {
    const itemIds = this.parseItemIds(itemId);
    const items = await this.getOrderItems(itemIds);

    this.validateItems(items);
    await this.validateScreenAccess(items, userId);
    await this.validatePreparationState(items, isPrepared);

    await this.updateItemsPreparationStatus(items, userId, isPrepared);
  }

  /**
   * Actualiza todos los items de una pantalla con un nuevo estado
   */
  async updateItemsForScreenStatus(
    orderId: string,
    screenId: string,
    newStatus: PreparationStatus,
    userId: string | null,
  ): Promise<void> {
    const items = await this.getItemsByOrderAndScreen(orderId, screenId);

    if (items.length === 0) {
      return;
    }

    const updates = items.map((item) =>
      this.createItemUpdate(item, newStatus, userId),
    );
    await this.orderItemRepository.save(updates);
  }

  /**
   * Parsea los IDs de items (puede ser un solo ID o múltiples separados por coma)
   */
  private parseItemIds(itemId: string): string[] {
    return itemId.split(',');
  }

  /**
   * Obtiene los items de orden por IDs
   */
  private async getOrderItems(itemIds: string[]): Promise<OrderItemEntity[]> {
    const items = await this.orderItemRepository.find({
      where: { id: In(itemIds) },
      relations: [
        'product',
        'order',
        'order.orderItems',
        'order.orderItems.product',
      ],
    });

    if (items.length === 0) {
      throw new NotFoundException('Order items not found');
    }

    return items;
  }

  /**
   * Obtiene items por orden y pantalla
   */
  private async getItemsByOrderAndScreen(
    orderId: string,
    screenId: string,
  ): Promise<OrderItemEntity[]> {
    return this.orderItemRepository.find({
      where: {
        order: { id: orderId },
        product: { preparationScreenId: screenId },
      },
      relations: ['product'],
    });
  }

  /**
   * Valida que los items sean válidos y pertenezcan a la misma orden
   */
  private validateItems(items: OrderItemEntity[]): void {
    const orderIds = [...new Set(items.map((item) => item.order.id))];
    if (orderIds.length > 1) {
      throw new BadRequestException(
        'Los items pertenecen a diferentes órdenes',
      );
    }
  }

  /**
   * Valida que el usuario tenga acceso a la pantalla
   */
  private async validateScreenAccess(
    items: OrderItemEntity[],
    userId: string,
  ): Promise<void> {
    const preparationScreenId = items[0].product?.preparationScreenId;

    if (!preparationScreenId) {
      throw new BadRequestException(
        'El producto no tiene pantalla de preparación asignada',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    if (
      !user ||
      !user.preparationScreen ||
      user.preparationScreen.id !== preparationScreenId
    ) {
      throw new ForbiddenException(
        'No tienes acceso a esta pantalla de preparación',
      );
    }
  }

  /**
   * Valida el estado de preparación actual de los items
   */
  private async validatePreparationState(
    items: OrderItemEntity[],
    isPrepared: boolean,
  ): Promise<void> {
    const order = items[0].order;
    const screenId = items[0].product?.preparationScreenId;

    if (!screenId) {
      throw new BadRequestException(
        'El producto no tiene pantalla de preparación asignada',
      );
    }

    const screenStatus = await this.screenStatusRepository.findByOrderAndScreen(
      order.id,
      screenId,
    );

    // Verificar que la pantalla esté EN PREPARACIÓN
    if (
      !screenStatus ||
      screenStatus.status !== PreparationScreenStatus.IN_PREPARATION
    ) {
      throw new BadRequestException(
        'Solo se pueden modificar los items cuando la pantalla está en preparación',
      );
    }

    if (isPrepared) {
      this.validateItemsCanBeMarkedReady(items);
    } else {
      this.validateItemsCanBeMarkedInProgress(items);
    }
  }

  /**
   * Valida que los items puedan marcarse como listos
   */
  private validateItemsCanBeMarkedReady(items: OrderItemEntity[]): void {
    const allItemsInProgress = items.every(
      (item) => item.preparationStatus === PreparationStatus.IN_PROGRESS,
    );

    if (!allItemsInProgress) {
      throw new BadRequestException(
        'Solo se pueden marcar como preparados los items que están en preparación (IN_PROGRESS)',
      );
    }
  }

  /**
   * Valida que los items puedan regresarse a preparación
   */
  private validateItemsCanBeMarkedInProgress(items: OrderItemEntity[]): void {
    const allItemsReady = items.every(
      (item) => item.preparationStatus === PreparationStatus.READY,
    );

    if (!allItemsReady) {
      throw new BadRequestException(
        'Solo se pueden regresar a preparación los items que están listos (READY)',
      );
    }
  }

  /**
   * Actualiza el estado de preparación de los items
   */
  private async updateItemsPreparationStatus(
    items: OrderItemEntity[],
    userId: string,
    isPrepared: boolean,
  ): Promise<void> {
    const updates = items.map((item) => {
      const newStatus = isPrepared
        ? PreparationStatus.READY
        : PreparationStatus.IN_PROGRESS;
      return this.createItemUpdate(item, newStatus, isPrepared ? userId : null);
    });

    await this.orderItemRepository.save(updates);
  }

  /**
   * Crea un objeto de actualización para un item
   */
  private createItemUpdate(
    item: OrderItemEntity,
    newStatus: PreparationStatus,
    userId: string | null,
  ): OrderItemEntity {
    item.preparationStatus = newStatus;
    item.statusChangedAt = new Date();

    if (newStatus === PreparationStatus.READY && userId) {
      item.preparedAt = new Date();
      item.preparedById = userId;
    } else if (newStatus === PreparationStatus.IN_PROGRESS) {
      item.preparedAt = null;
      item.preparedById = null;
    } else if (newStatus === PreparationStatus.PENDING) {
      item.preparedAt = null;
      item.preparedById = null;
    }

    return item;
  }
}
