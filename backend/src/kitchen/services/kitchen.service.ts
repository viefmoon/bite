import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import { KitchenOrderOptimizedDto } from '../dto/kitchen-order-optimized.dto';
import { OrderStatus } from '../../orders/domain/enums/order-status.enum';
import { PreparationStatus } from '../../orders/domain/order-item';
import { ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY } from '../../common/tokens';
import { OrderPreparationScreenStatusRepository } from '../../orders/infrastructure/persistence/order-preparation-screen-status.repository';
import { PreparationScreenStatus } from '../../orders/domain/order-preparation-screen-status';
import { KitchenOrderQueryBuilderService } from './kitchen-order-query-builder.service';
import { KitchenOrderMapperService } from './kitchen-order-mapper.service';
import { ScreenStatusProcessorService } from './screen-status-processor.service';
import { OrderItemOperationsService } from './order-item-operations.service';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY)
    private readonly screenStatusRepository: OrderPreparationScreenStatusRepository,
    private readonly queryBuilder: KitchenOrderQueryBuilderService,
    private readonly mapper: KitchenOrderMapperService,
    private readonly screenProcessor: ScreenStatusProcessorService,
    private readonly itemOperations: OrderItemOperationsService,
  ) {}

  async getKitchenOrders(
    userId: string,
    filters: KitchenOrderFilterDto,
  ): Promise<KitchenOrderOptimizedDto[]> {
    // Obtener la pantalla de preparación del usuario
    const userScreenId = await this.getUserScreenId(userId, filters.screenId);

    // Ejecutar query con filtros aplicados
    const orders = await this.queryBuilder.buildAndExecuteQuery(
      this.orderRepository,
      filters,
      userScreenId,
    );

    // Procesar estados de pantalla desde las órdenes cargadas
    const screenStatuses =
      this.screenProcessor.processScreenStatusesFromOrders(orders);

    // Filtrar órdenes según estado de pantalla
    const filteredOrders = this.screenProcessor.filterOrdersByScreenStatus(
      orders,
      screenStatuses,
      userScreenId,
      filters,
    );

    // Transformar a DTOs optimizados
    return filteredOrders.map((order) =>
      this.mapper.transformToKitchenOrderOptimized(
        order,
        userScreenId || '',
        filters,
        screenStatuses.get(order.id) || new Map(),
      ),
    );
  }

  /**
   * Obtiene la pantalla de preparación del usuario
   */
  private async getUserScreenId(
    userId: string,
    filterScreenId?: string,
  ): Promise<string | null> {
    if (filterScreenId) {
      return filterScreenId;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    return user?.preparationScreen?.id || null;
  }

  async markItemPrepared(
    itemId: string,
    userId: string,
    isPrepared: boolean = true,
  ): Promise<void> {
    await this.itemOperations.markItemPrepared(itemId, userId, isPrepared);
  }

  async getUserDefaultScreen(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen', 'role'],
    });

    return user?.preparationScreen || null;
  }

  async startPreparationForScreen(
    orderId: string,
    userId: string,
  ): Promise<void> {
    const screenId = await this.getUserScreenIdForUser(userId);

    // Crear o actualizar el estado de la pantalla
    await this.screenStatusRepository.createOrUpdate(orderId, screenId, {
      status: PreparationScreenStatus.IN_PREPARATION,
      startedAt: new Date(),
      startedById: userId,
    });

    // Actualizar todos los items de esta pantalla a IN_PROGRESS
    await this.itemOperations.updateItemsForScreenStatus(
      orderId,
      screenId,
      PreparationStatus.IN_PROGRESS,
      userId,
    );

    // Actualizar el estado general de la orden
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  async completePreparationForScreen(
    orderId: string,
    userId: string,
  ): Promise<void> {
    const screenId = await this.getUserScreenIdForUser(userId);

    // Actualizar el estado de la pantalla
    await this.screenStatusRepository.createOrUpdate(orderId, screenId, {
      status: PreparationScreenStatus.READY,
      completedAt: new Date(),
      completedById: userId,
    });

    // Actualizar todos los items de esta pantalla a READY
    await this.itemOperations.updateItemsForScreenStatus(
      orderId,
      screenId,
      PreparationStatus.READY,
      userId,
    );

    // Actualizar el estado general de la orden
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  async cancelPreparationForScreen(
    orderId: string,
    userId: string,
  ): Promise<void> {
    const screenId = await this.getUserScreenIdForUser(userId);

    // Verificar el estado actual
    const currentStatus =
      await this.screenStatusRepository.findByOrderAndScreen(orderId, screenId);

    if (currentStatus) {
      if (currentStatus.status === PreparationScreenStatus.IN_PREPARATION) {
        // Regresar a PENDING
        await this.screenStatusRepository.update(currentStatus.id, {
          status: PreparationScreenStatus.PENDING,
          startedAt: null,
          startedById: null,
        });

        // Actualizar items a PENDING
        await this.itemOperations.updateItemsForScreenStatus(
          orderId,
          screenId,
          PreparationStatus.PENDING,
          null,
        );
      } else if (currentStatus.status === PreparationScreenStatus.READY) {
        // Regresar a IN_PREPARATION
        await this.screenStatusRepository.update(currentStatus.id, {
          status: PreparationScreenStatus.IN_PREPARATION,
          completedAt: null,
          completedById: null,
        });

        // Actualizar items a IN_PROGRESS
        await this.itemOperations.updateItemsForScreenStatus(
          orderId,
          screenId,
          PreparationStatus.IN_PROGRESS,
          userId,
        );
      }
    }

    // Actualizar el estado general de la orden
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  /**
   * Obtiene el screenId del usuario y valida que tenga uno asignado
   */
  private async getUserScreenIdForUser(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    if (!user?.preparationScreen) {
      throw new ForbiddenException(
        'No tienes una pantalla de preparación asignada',
      );
    }

    return user.preparationScreen.id;
  }

  private async updateOrderStatusBasedOnScreens(
    orderId: string,
  ): Promise<void> {
    // Obtener todos los estados de pantalla para esta orden
    const screenStatuses =
      await this.screenStatusRepository.findByOrderId(orderId);

    // Obtener la orden con sus items
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product'],
    });

    if (!order) return;

    // Obtener todas las pantallas únicas que tienen productos en esta orden
    const screenIds = this.screenProcessor.getUniqueScreenIds(order);

    // Si no hay pantallas asignadas, no hacemos nada
    if (screenIds.size === 0) return;

    // Procesar estados de pantalla
    const screenStatusMap = new Map<string, any>();
    screenStatuses.forEach((status) => {
      screenStatusMap.set(status.preparationScreenId, status);
    });

    // Verificar estados de pantallas
    const allReady = this.screenProcessor.areAllScreensReady(
      screenIds,
      screenStatusMap,
    );
    const anyInPreparation = this.screenProcessor.isAnyScreenInPreparation(
      screenIds,
      screenStatusMap,
    );

    // Determinar nuevo estado de la orden
    const newOrderStatus = this.determineNewOrderStatus(
      order.orderStatus,
      allReady,
      anyInPreparation,
    );

    // Solo actualizar si cambió el estado
    if (newOrderStatus !== order.orderStatus) {
      await this.orderRepository.save({
        ...order,
        orderStatus: newOrderStatus,
      });
    }
  }

  /**
   * Determina el nuevo estado de la orden basado en los estados de las pantallas
   */
  private determineNewOrderStatus(
    currentStatus: OrderStatus,
    allReady: boolean,
    anyInPreparation: boolean,
  ): OrderStatus {
    if (allReady) {
      return OrderStatus.READY;
    } else if (anyInPreparation) {
      return OrderStatus.IN_PREPARATION;
    } else if (
      currentStatus === OrderStatus.READY ||
      currentStatus === OrderStatus.IN_PREPARATION
    ) {
      // Si la orden estaba lista o en preparación pero no todas las pantallas están listas,
      // regresar a IN_PROGRESS
      return OrderStatus.IN_PROGRESS;
    }

    return currentStatus;
  }
}
