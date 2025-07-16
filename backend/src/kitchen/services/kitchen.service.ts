import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { OrderItemEntity } from '../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import {
  KitchenOrderDto,
  KitchenOrderItemDto,
} from '../dto/kitchen-order-response.dto';
import {
  KitchenOrderOptimizedDto,
  KitchenOrderItemOptimizedDto,
  ScreenStatusOptimizedDto,
} from '../dto/kitchen-order-optimized.dto';
import { OrderStatus } from '../../orders/domain/enums/order-status.enum';
import { PreparationStatus } from '../../orders/domain/order-item';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY } from '../../common/tokens';
import { OrderPreparationScreenStatusRepository } from '../../orders/infrastructure/persistence/order-preparation-screen-status.repository';
import { PreparationScreenStatus } from '../../orders/domain/order-preparation-screen-status';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY)
    private readonly screenStatusRepository: OrderPreparationScreenStatusRepository,
  ) {}

  async getKitchenOrders(
    userId: string,
    filters: KitchenOrderFilterDto,
  ): Promise<KitchenOrderOptimizedDto[]> {
    // Obtener la pantalla de preparación del usuario
    let userScreenId: string | null = null;

    if (!filters.screenId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['preparationScreen'],
      });

      if (!user || !user.preparationScreen) {
        // No lanzar error, simplemente mostrar todos los productos
        userScreenId = null;
      } else {
        userScreenId = user.preparationScreen.id;
      }
    } else {
      userScreenId = filters.screenId;
    }

    // Construir query base para órdenes - Usando 'o' como alias en lugar de 'order' que es palabra reservada
    const queryBuilder = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('orderItem.productVariant', 'variant')
      .leftJoinAndSelect('orderItem.productModifiers', 'modifiers')
      .leftJoinAndSelect(
        'orderItem.selectedPizzaCustomizations',
        'pizzaCustomizations',
      )
      .leftJoinAndSelect(
        'pizzaCustomizations.pizzaCustomization',
        'customization',
      )
      .leftJoinAndSelect('orderItem.preparedBy', 'preparedBy')
      .leftJoinAndSelect('o.table', 'table')
      .leftJoinAndSelect('table.area', 'area')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.deliveryInfo', 'deliveryInfo')
      // No aplicar filtro inicial de status aquí, se aplicará más adelante según showPrepared
      .where('1=1');

    // Filtrar por tipo de orden
    if (filters.orderType) {
      queryBuilder.andWhere('o.orderType = :orderType', {
        orderType: filters.orderType,
      });
    }

    // Si no se muestran todos los productos, filtrar por pantalla
    if (!filters.showAllProducts) {
      // Solo incluir órdenes que tengan al menos un producto de la pantalla del usuario
      queryBuilder.andWhere(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('oi.order_id')
            .from('order_item', 'oi')
            .innerJoin('product', 'p', 'oi.product_id = p.id')
            .where('p.preparation_screen_id = :screenId')
            .getQuery();
          return `o.id IN ${subQuery}`;
        },
        { screenId: userScreenId },
      );
    }

    // Solo excluir órdenes completadas o canceladas (estos estados sí son finales)
    queryBuilder.andWhere('o.orderStatus NOT IN (:...excludedStatuses)', {
      excludedStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    });

    queryBuilder.orderBy('o.createdAt', 'ASC');

    const orders = await queryBuilder.getMany();

    // Obtener los estados de preparación por pantalla para todas las órdenes
    const orderIds = orders.map((order) => order.id);
    const screenStatuses = await this.getScreenStatusesForOrders(orderIds);

    // Filtrar órdenes basándonos en el estado de la pantalla del usuario
    const filteredOrders = orders.filter((order) => {
      const screenStatus = screenStatuses.get(order.id)?.get(userScreenId!);

      if (filters.showPrepared) {
        // Solo mostrar si la pantalla tiene estado READY
        return screenStatus?.status === PreparationScreenStatus.READY;
      } else {
        // Mostrar si no existe estado o no está READY
        return (
          !screenStatus || screenStatus.status !== PreparationScreenStatus.READY
        );
      }
    });

    // Transformar a DTOs optimizados con información de estados por pantalla
    return filteredOrders.map((order) =>
      this.transformToKitchenOrderOptimized(
        order,
        userScreenId!,
        filters,
        screenStatuses.get(order.id) || new Map(),
      ),
    );
  }

  private async getScreenStatusesForOrders(
    orderIds: string[],
  ): Promise<Map<string, Map<string, any>>> {
    if (!orderIds.length) return new Map();

    const statusMap = new Map<string, Map<string, any>>();

    // Obtener todos los estados de una vez para optimizar
    const allStatuses: any[] = [];
    for (const orderId of orderIds) {
      const statuses = await this.screenStatusRepository.findByOrderId(orderId);
      allStatuses.push(...statuses);
    }

    // Agrupar por orderId
    for (const orderId of orderIds) {
      const orderStatuses = allStatuses.filter((s) => s.orderId === orderId);
      const orderStatusMap = new Map<string, any>();

      orderStatuses.forEach((status) => {
        orderStatusMap.set(status.preparationScreenId, status);
      });

      statusMap.set(orderId, orderStatusMap);
    }

    return statusMap;
  }

  private transformToKitchenOrderOptimized(
    order: OrderEntity,
    userScreenId: string,
    filters: KitchenOrderFilterDto,
    screenStatuses: Map<string, any>,
  ): KitchenOrderOptimizedDto {
    const dto = new KitchenOrderOptimizedDto();
    dto.id = order.id;
    dto.shiftOrderNumber = order.shiftOrderNumber;
    dto.orderType = order.orderType;
    dto.orderStatus = order.orderStatus;
    dto.createdAt = order.createdAt;
    dto.orderNotes = order.notes || undefined;

    // Agregar información específica según tipo
    switch (order.orderType) {
      case OrderType.DELIVERY:
        if (order.deliveryInfo) {
          dto.deliveryAddress = order.deliveryInfo.fullAddress;
          dto.deliveryPhone = order.deliveryInfo.recipientPhone;
        }
        break;
      case OrderType.TAKE_AWAY:
        if (order.customer) {
          dto.receiptName =
            `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
            'Cliente';
          dto.customerPhone = order.customer.whatsappPhoneNumber;
        }
        break;
      case OrderType.DINE_IN:
        dto.areaName = order.table?.area?.name;
        dto.tableName = order.table?.name;
        break;
    }

    // Procesar items
    const itemGroups = this.groupOrderItems(
      order.orderItems || [],
      filters.ungroupProducts || false,
    );

    dto.items = itemGroups
      .map((group) => {
        const item = group.items[0]; // Usar el primer item como referencia

        if (!item.product) {
          return null;
        }

        const itemDto = new KitchenOrderItemOptimizedDto();

        itemDto.id = group.items.map((i) => i.id).join(','); // IDs concatenados para grupo
        itemDto.productName = item.product.name;
        itemDto.variantName = item.productVariant?.name;
        itemDto.modifiers = item.productModifiers?.map((m) => m.name) || [];
        
        // Solo incluir pizzaCustomizations si existen
        if (item.selectedPizzaCustomizations?.length) {
          itemDto.pizzaCustomizations =
            item.selectedPizzaCustomizations.map((pc) => ({
              customizationName: pc.pizzaCustomization.name,
              action: pc.action,
              half: pc.half,
            }));
        }
        
        itemDto.preparationNotes = item.preparationNotes || undefined;
        itemDto.preparationStatus = item.preparationStatus;
        itemDto.preparedAt = item.preparedAt || undefined;
        
        // Solo incluir preparedByUser si existe
        if (item.preparedBy) {
          itemDto.preparedByUser = {
            firstName: item.preparedBy.firstName || '',
            lastName: item.preparedBy.lastName || '',
          };
        }
        
        itemDto.quantity = group.items.length;
        itemDto.belongsToMyScreen = userScreenId
          ? item.product.preparationScreenId === userScreenId
          : true;

        return itemDto;
      })
      .filter((item): item is KitchenOrderItemOptimizedDto => item !== null);

    // Filtrar items según configuración
    if (!filters.showAllProducts) {
      dto.items = dto.items.filter((item) => item.belongsToMyScreen);
    }

    dto.hasPendingItems = dto.items.some(
      (item) =>
        item.belongsToMyScreen &&
        item.preparationStatus !== PreparationStatus.READY,
    );

    // Agregar información optimizada de estados por pantalla
    dto.screenStatuses = [];
    for (const [, status] of screenStatuses) {
      if (status.preparationScreen) {
        const screenStatusDto = new ScreenStatusOptimizedDto();
        screenStatusDto.screenId = status.preparationScreenId;
        screenStatusDto.screenName = status.preparationScreen.name;
        screenStatusDto.status = status.status;
        dto.screenStatuses.push(screenStatusDto);
      }
    }

    // Agregar el estado de mi pantalla
    const myScreenStatus = screenStatuses.get(userScreenId);
    dto.myScreenStatus =
      myScreenStatus?.status || PreparationScreenStatus.PENDING;

    return dto;
  }

  // Mantener el método original para compatibilidad si es necesario
  private transformToKitchenOrder(
    order: OrderEntity,
    userScreenId: string,
    filters: KitchenOrderFilterDto,
    screenStatuses: Map<string, any>,
  ): KitchenOrderDto {
    const dto = new KitchenOrderDto();
    dto.id = order.id;
    dto.shiftOrderNumber = order.shiftOrderNumber;
    dto.orderType = order.orderType;
    dto.orderStatus = order.orderStatus;
    dto.createdAt = order.createdAt;
    dto.orderNotes = order.notes || undefined;

    // Agregar información específica según tipo
    switch (order.orderType) {
      case OrderType.DELIVERY:
        if (order.deliveryInfo) {
          dto.deliveryAddress = order.deliveryInfo.fullAddress;
          dto.deliveryPhone = order.deliveryInfo.recipientPhone;
        }
        break;
      case OrderType.TAKE_AWAY:
        if (order.customer) {
          dto.receiptName =
            `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
            'Cliente';
          dto.customerPhone = order.customer.whatsappPhoneNumber;
        }
        break;
      case OrderType.DINE_IN:
        dto.areaName = order.table?.area?.name;
        dto.tableName = order.table?.name;
        break;
    }

    // Procesar items
    const itemGroups = this.groupOrderItems(
      order.orderItems || [],
      filters.ungroupProducts || false,
    );

    dto.items = itemGroups
      .map((group) => {
        const item = group.items[0]; // Usar el primer item como referencia

        if (!item.product) {
          return null;
        }

        const itemDto = new KitchenOrderItemDto();

        itemDto.id = group.items.map((i) => i.id).join(','); // IDs concatenados para grupo
        itemDto.productName = item.product.name;
        itemDto.variantName = item.productVariant?.name;
        itemDto.modifiers = item.productModifiers?.map((m) => m.name) || [];
        itemDto.pizzaCustomizations =
          item.selectedPizzaCustomizations?.map((pc) => ({
            customizationName: pc.pizzaCustomization.name,
            action: pc.action,
            half: pc.half,
          })) || [];
        itemDto.preparationNotes = item.preparationNotes || undefined;
        itemDto.preparationStatus = item.preparationStatus;
        itemDto.preparedAt = item.preparedAt || undefined;
        itemDto.preparedBy = item.preparedBy?.username;
        itemDto.preparedByUser = item.preparedBy
          ? {
              firstName: item.preparedBy.firstName || '',
              lastName: item.preparedBy.lastName || '',
            }
          : undefined;
        itemDto.createdAt = item.createdAt || undefined;
        itemDto.quantity = group.items.length;
        itemDto.belongsToMyScreen = userScreenId
          ? item.product.preparationScreenId === userScreenId
          : true; // Si no hay userScreenId, todos los items "pertenecen" a la pantalla
        itemDto.preparationScreenId =
          item.product.preparationScreenId || undefined;

        return itemDto;
      })
      .filter((item): item is KitchenOrderItemDto => item !== null);

    // Filtrar items según configuración
    if (!filters.showAllProducts) {
      dto.items = dto.items.filter((item) => item.belongsToMyScreen);
    }

    // Siempre mostrar todos los items, incluyendo los preparados
    // if (!filters.showPrepared) {
    //   dto.items = dto.items.filter(
    //     (item) => item.preparationStatus !== PreparationStatus.READY,
    //   );
    // }

    dto.hasPendingItems = dto.items.some(
      (item) =>
        item.belongsToMyScreen &&
        item.preparationStatus !== PreparationStatus.READY,
    );

    // Agregar información de estados por pantalla
    dto.screenStatuses = [];
    for (const [, status] of screenStatuses) {
      if (status.preparationScreen) {
        dto.screenStatuses.push({
          screenId: status.preparationScreenId,
          screenName: status.preparationScreen.name,
          status: status.status,
          startedAt: status.startedAt,
          completedAt: status.completedAt,
          startedBy: status.startedBy
            ? {
                firstName: status.startedBy.firstName || '',
                lastName: status.startedBy.lastName || '',
              }
            : undefined,
        });
      }
    }

    // Agregar el estado de mi pantalla
    const myScreenStatus = screenStatuses.get(userScreenId);
    dto.myScreenStatus =
      myScreenStatus?.status || PreparationScreenStatus.PENDING;

    return dto;
  }

  private groupOrderItems(
    items: OrderItemEntity[],
    ungroup: boolean,
  ): { items: OrderItemEntity[] }[] {
    if (ungroup) {
      return items.map((item) => ({ items: [item] }));
    }

    const groups: Map<string, OrderItemEntity[]> = new Map();

    items.forEach((item) => {
      const key = this.getItemGroupKey(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((items) => ({ items }));
  }

  private getItemGroupKey(item: OrderItemEntity): string {
    const parts = [
      item.productId,
      item.productVariantId || 'no-variant',
      item.preparationStatus,
      item.preparationNotes || 'no-notes',
      (item.productModifiers || [])
        .map((m) => m.id)
        .sort()
        .join(','),
      (item.selectedPizzaCustomizations || [])
        .map((pc) => `${pc.pizzaCustomizationId}-${pc.action}-${pc.half}`)
        .sort()
        .join(','),
    ];

    return parts.join('|');
  }

  async markItemPrepared(
    itemId: string,
    userId: string,
    isPrepared: boolean = true,
  ): Promise<void> {
    // Si el ID contiene comas, es un grupo de items
    const itemIds = itemId.split(',');

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

    // Verificar que todos los items pertenezcan a la misma orden
    const orderIds = [...new Set(items.map((item) => item.order.id))];
    if (orderIds.length > 1) {
      throw new BadRequestException(
        'Los items pertenecen a diferentes órdenes',
      );
    }

    // Obtener la orden y el estado de la pantalla
    const order = items[0].order;
    const screenId = items[0].product?.preparationScreenId;

    if (!screenId) {
      throw new BadRequestException(
        'El producto no tiene pantalla de preparación asignada',
      );
    }

    // Verificar el estado de la pantalla
    const screenStatus = await this.screenStatusRepository.findByOrderAndScreen(
      order.id,
      screenId,
    );

    // Verificar que la pantalla esté EN PREPARACIÓN para poder hacer cambios a los items
    if (
      !screenStatus ||
      screenStatus.status !== PreparationScreenStatus.IN_PREPARATION
    ) {
      throw new BadRequestException(
        'Solo se pueden modificar los items cuando la pantalla está en preparación',
      );
    }

    // Verificar que el item actual esté IN_PROGRESS si se quiere marcar como preparado
    if (isPrepared) {
      const allItemsInProgress = items.every(
        (item) => item.preparationStatus === PreparationStatus.IN_PROGRESS,
      );

      if (!allItemsInProgress) {
        throw new BadRequestException(
          'Solo se pueden marcar como preparados los items que están en preparación (IN_PROGRESS)',
        );
      }
    }

    // Si se quiere desmarcar como preparado (isPrepared = false)
    if (!isPrepared) {
      const allItemsReady = items.every(
        (item) => item.preparationStatus === PreparationStatus.READY,
      );

      if (!allItemsReady) {
        throw new BadRequestException(
          'Solo se pueden regresar a preparación los items que están listos (READY)',
        );
      }
    }

    // Verificar que el usuario tenga acceso a la pantalla del producto
    const preparationScreenId = items[0].product.preparationScreenId;
    if (!preparationScreenId) {
      throw new ForbiddenException(
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

    // Actualizar items
    const updates = items.map((item) => {
      item.preparationStatus = isPrepared
        ? PreparationStatus.READY
        : PreparationStatus.IN_PROGRESS;
      item.statusChangedAt = new Date();

      if (isPrepared) {
        item.preparedAt = new Date();
        item.preparedById = userId;
      } else {
        item.preparedAt = null;
        item.preparedById = null;
      }

      return item;
    });

    await this.orderItemRepository.save(updates);

    // El estado de la orden se actualiza basándose en los estados de todas las pantallas
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
    // Obtener la pantalla del usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    if (!user?.preparationScreen) {
      throw new ForbiddenException(
        'No tienes una pantalla de preparación asignada',
      );
    }

    const screenId = user.preparationScreen.id;

    // Crear o actualizar el estado de la pantalla
    await this.screenStatusRepository.createOrUpdate(orderId, screenId, {
      status: PreparationScreenStatus.IN_PREPARATION,
      startedAt: new Date(),
      startedById: userId,
    });

    // Actualizar todos los items de esta pantalla a IN_PROGRESS
    await this.updateItemsForScreenStatus(
      orderId,
      screenId,
      PreparationStatus.IN_PROGRESS,
      userId,
    );

    // Actualizar el estado general de la orden si es necesario
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  async completePreparationForScreen(
    orderId: string,
    userId: string,
  ): Promise<void> {
    // Obtener la pantalla del usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    if (!user?.preparationScreen) {
      throw new ForbiddenException(
        'No tienes una pantalla de preparación asignada',
      );
    }

    const screenId = user.preparationScreen.id;

    // Actualizar el estado de la pantalla
    await this.screenStatusRepository.createOrUpdate(orderId, screenId, {
      status: PreparationScreenStatus.READY,
      completedAt: new Date(),
      completedById: userId,
    });

    // Actualizar todos los items de esta pantalla a READY
    await this.updateItemsForScreenStatus(
      orderId,
      screenId,
      PreparationStatus.READY,
      userId,
    );

    // Actualizar el estado general de la orden si es necesario
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  async cancelPreparationForScreen(
    orderId: string,
    userId: string,
  ): Promise<void> {
    // Obtener la pantalla del usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['preparationScreen'],
    });

    if (!user?.preparationScreen) {
      throw new ForbiddenException(
        'No tienes una pantalla de preparación asignada',
      );
    }

    const screenId = user.preparationScreen.id;

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
        await this.updateItemsForScreenStatus(
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
        await this.updateItemsForScreenStatus(
          orderId,
          screenId,
          PreparationStatus.IN_PROGRESS,
          userId,
        );
      }
    }

    // Actualizar el estado general de la orden si es necesario
    await this.updateOrderStatusBasedOnScreens(orderId);
  }

  private async updateItemsForScreenStatus(
    orderId: string,
    screenId: string,
    newStatus: PreparationStatus,
    userId: string | null,
  ): Promise<void> {
    // Obtener todos los items de la orden que pertenecen a esta pantalla
    const items = await this.orderItemRepository.find({
      where: {
        order: { id: orderId },
        product: { preparationScreenId: screenId },
      },
      relations: ['product'],
    });

    // Actualizar el estado de cada item
    const updates = items.map((item) => {
      item.preparationStatus = newStatus;
      item.statusChangedAt = new Date();

      if (newStatus === PreparationStatus.READY) {
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
    });

    if (updates.length > 0) {
      await this.orderItemRepository.save(updates);
    }
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
    const screenIds = new Set<string>();
    order.orderItems?.forEach((item) => {
      if (item.product?.preparationScreenId) {
        screenIds.add(item.product.preparationScreenId);
      }
    });

    // Si no hay pantallas asignadas, no hacemos nada
    if (screenIds.size === 0) return;

    // Verificar el estado de cada pantalla
    let allReady = true;
    let anyInPreparation = false;

    for (const screenId of screenIds) {
      const status = screenStatuses.find(
        (s) => s.preparationScreenId === screenId,
      );

      if (!status || status.status !== PreparationScreenStatus.READY) {
        allReady = false;
      }

      if (status?.status === PreparationScreenStatus.IN_PREPARATION) {
        anyInPreparation = true;
      }
    }

    // Actualizar el estado de la orden según los estados de las pantallas
    let newOrderStatus = order.orderStatus;

    if (allReady) {
      newOrderStatus = OrderStatus.READY;
    } else if (anyInPreparation) {
      newOrderStatus = OrderStatus.IN_PREPARATION;
    } else if (
      order.orderStatus === OrderStatus.READY ||
      order.orderStatus === OrderStatus.IN_PREPARATION
    ) {
      // Si la orden estaba lista o en preparación pero no todas las pantallas están listas,
      // regresar a IN_PROGRESS
      newOrderStatus = OrderStatus.IN_PROGRESS;
    }

    // Solo actualizar si cambió el estado
    if (newOrderStatus !== order.orderStatus) {
      await this.orderRepository.save({
        ...order,
        orderStatus: newOrderStatus,
      });
    }
  }
}
