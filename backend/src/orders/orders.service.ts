import {
  Inject,
  forwardRef,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Order } from './domain/order';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from './domain/enums/order-status.enum';
import { OrderItemRepository } from './infrastructure/persistence/order-item.repository';
import { OrderItem } from './domain/order-item';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { PreparationStatus } from './domain/order-item';
import { PaymentMethod } from '../payments/domain/enums/payment-method.enum';
import { v4 as uuidv4 } from 'uuid';
import { TicketImpressionRepository } from './infrastructure/persistence/ticket-impression.repository';
import { TicketType } from './domain/enums/ticket-type.enum';
import { TicketImpression } from './domain/ticket-impression';
import {
  ORDER_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  TICKET_IMPRESSION_REPOSITORY,
  PRODUCT_REPOSITORY,
  ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY,
} from '../common/tokens';
import { FinalizeOrdersDto } from './dto/finalize-orders.dto';
import {
  OrderForFinalizationDto,
  OrderItemForFinalizationDto,
} from './dto/order-for-finalization.dto';
import { OrderForFinalizationListDto } from './dto/order-for-finalization-list.dto';
import { OrderOpenListDto } from './dto/order-open-list.dto';
import { ReceiptListDto } from './dto/receipt-list.dto';
import { CustomersService } from '../customers/customers.service';
import { DeliveryInfo } from './domain/delivery-info';
import { RestaurantConfigService } from '../restaurant-config/restaurant-config.service';
import { OrderType } from './domain/enums/order-type.enum';
import { ProductRepository } from '../products/infrastructure/persistence/product.repository';
import { OrderChangeTrackerV2Service } from './services/order-change-tracker-v2.service';
import { UserContextService } from '../common/services/user-context.service';
import { DataSource, Not, In, Between } from 'typeorm';
import { OrderEntity } from './infrastructure/persistence/relational/entities/order.entity';
import { OrderPreparationScreenStatusRepository } from './infrastructure/persistence/order-preparation-screen-status.repository';
import {
  PreparationScreenStatus,
  OrderPreparationScreenStatus,
} from './domain/order-preparation-screen-status';
import { PaymentsService } from '../payments/payments.service';
import { TablesService } from '../tables/tables.service';
import { AutomaticPrintingService } from '../thermal-printers/automatic-printing.service';
import { ShiftsService } from '../shifts/shifts.service';
import { ThermalPrintersService } from '../thermal-printers/thermal-printers.service';
import { ThermalPrinter } from '../thermal-printers/domain/thermal-printer';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly orderItemRepository: OrderItemRepository,
    @Inject(TICKET_IMPRESSION_REPOSITORY)
    private readonly ticketImpressionRepository: TicketImpressionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY)
    private readonly screenStatusRepository: OrderPreparationScreenStatusRepository,
    private readonly customersService: CustomersService,
    private readonly restaurantConfigService: RestaurantConfigService,
    private readonly orderChangeTracker: OrderChangeTrackerV2Service,
    private readonly userContextService: UserContextService,
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly tablesService: TablesService,
    private readonly shiftsService: ShiftsService,
    @Inject(forwardRef(() => AutomaticPrintingService))
    private readonly automaticPrintingService: AutomaticPrintingService,
    @Inject(forwardRef(() => ThermalPrintersService))
    private readonly thermalPrintersService: ThermalPrintersService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validar que haya un turno abierto
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift || !currentShift.isOpen()) {
      throw new BadRequestException(
        'No se pueden crear órdenes. No hay un turno abierto. Por favor, solicite a un administrador o gerente que abra el turno.',
      );
    }

    // Validar si el cliente está baneado
    if (createOrderDto.customerId) {
      const isBanned = await this.customersService.isCustomerBanned(
        createOrderDto.customerId,
      );
      if (isBanned) {
        throw new BadRequestException(
          'No se puede crear un pedido para un cliente baneado',
        );
      }
    }

    // Manejar la creación de mesa temporal si es necesario
    let tableId = createOrderDto.tableId;
    if (
      createOrderDto.isTemporaryTable &&
      createOrderDto.temporaryTableName &&
      createOrderDto.temporaryTableAreaId
    ) {
      // Crear mesa temporal
      const temporaryTable = await this.tablesService.create({
        name: createOrderDto.temporaryTableName,
        areaId: createOrderDto.temporaryTableAreaId,
        isTemporary: true,
        temporaryIdentifier: uuidv4(), // Identificador único para esta mesa temporal
        isActive: true,
        isAvailable: false, // La mesa temporal se ocupa inmediatamente
        capacity: 4, // Capacidad por defecto para mesas temporales
      });
      tableId = temporaryTable.id;
    }

    // Obtener la configuración del restaurante
    const restaurantConfig = await this.restaurantConfigService.getConfig();

    // Calcular el tiempo estimado de entrega basado en el tipo de orden
    let estimatedMinutes = 0;
    switch (createOrderDto.orderType) {
      case OrderType.DINE_IN:
        estimatedMinutes = restaurantConfig.estimatedDineInTime;
        break;
      case OrderType.TAKE_AWAY:
        estimatedMinutes = restaurantConfig.estimatedPickupTime;
        break;
      case OrderType.DELIVERY:
        estimatedMinutes = restaurantConfig.estimatedDeliveryTime;
        break;
    }

    // Calcular la fecha/hora estimada de entrega
    const now = new Date();
    const estimatedDeliveryTime = new Date(
      now.getTime() + estimatedMinutes * 60000,
    );

    // Crear la información de entrega solo si tiene datos reales
    let deliveryInfo: DeliveryInfo | null = null;

    // Verificar si deliveryInfo tiene algún campo con valor
    const hasDeliveryData =
      createOrderDto.deliveryInfo &&
      Object.entries(createOrderDto.deliveryInfo).some(
        ([, value]) => value !== undefined && value !== null && value !== '',
      );

    if (hasDeliveryData) {
      // Limpiar campos de deliveryInfo según el tipo de pedido
      const cleanedDeliveryInfo = this.cleanDeliveryInfoByOrderType(
        createOrderDto.deliveryInfo,
        createOrderDto.orderType,
      );

      // Solo crear deliveryInfo si quedan campos después de la limpieza
      const hasCleanedData = Object.entries(cleanedDeliveryInfo).some(
        ([, value]) => value !== undefined && value !== null && value !== '',
      );

      if (hasCleanedData) {
        deliveryInfo = {
          id: uuidv4(),
          ...cleanedDeliveryInfo,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as DeliveryInfo;
      }
    }

    const order = await this.orderRepository.create({
      userId: createOrderDto.userId || null,
      tableId: tableId || null, // Usar el tableId que puede ser de una mesa temporal
      shiftId: currentShift.id, // Asociar la orden al turno actual
      scheduledAt: createOrderDto.scheduledAt || null,
      orderType: createOrderDto.orderType,
      orderStatus: OrderStatus.IN_PROGRESS, // Estado inicial cuando se crea una orden
      subtotal: createOrderDto.subtotal,
      total: createOrderDto.total,
      notes: createOrderDto.notes,
      customerId: createOrderDto.customerId || null,
      isFromWhatsApp: createOrderDto.isFromWhatsApp || false,
      deliveryInfo: deliveryInfo,
      estimatedDeliveryTime: estimatedDeliveryTime,
    });

    // Marcar la mesa como ocupada si se asignó una mesa a la orden
    if (tableId && !createOrderDto.isTemporaryTable) {
      // Verificar que la mesa esté disponible antes de asignarla
      const table = await this.tablesService.findOne(tableId);
      if (!table.isAvailable) {
        throw new BadRequestException(
          `La mesa ${table.name} no está disponible`,
        );
      }

      await this.tablesService.update(tableId, { isAvailable: false });
    }

    if (createOrderDto.items && createOrderDto.items.length > 0) {
      for (const itemDto of createOrderDto.items) {
        // Crear un item individual
        const createOrderItemDto: CreateOrderItemDto = {
          orderId: order.id,
          productId: itemDto.productId,
          productVariantId: itemDto.productVariantId,
          basePrice: itemDto.basePrice,
          finalPrice: itemDto.finalPrice,
          preparationNotes: itemDto.preparationNotes,
          productModifiers: itemDto.productModifiers, // Pasar los modificadores aquí
          selectedPizzaCustomizations: itemDto.selectedPizzaCustomizations,
        };
        // Guardar el item
        await this.createOrderItemInternal(createOrderItemDto); // Usar método interno
      }
    }

    // Crear estados de pantalla para cada pantalla que tenga items
    await this.syncPreparationScreenStatuses(order.id);

    // Asociar pre-pago si se proporcionó uno
    if (createOrderDto.prepaymentId) {
      try {
        await this.paymentsService.associatePaymentToOrder(
          createOrderDto.prepaymentId,
          order.id,
        );
      } catch (error) {
        // Si falla la asociación del pago, registrar el error pero continuar
        // Ya que la orden ya fue creada exitosamente
        this.logger.error(
          `Error asociando pre-pago ${createOrderDto.prepaymentId} a orden ${order.id}:`,
          error,
        );
      }
    }

    // Recargar la orden completa con todas las relaciones
    const fullOrder = await this.findOne(order.id);

    // Obtener la entidad de orden para el historial
    const orderEntity = await this.dataSource.manager.findOne(OrderEntity, {
      where: { id: order.id },
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
      ],
    });

    if (orderEntity) {
      // Registrar manualmente el historial INSERT con todos los items
      await this.orderChangeTracker.trackOrderWithItems(
        'INSERT',
        orderEntity,
        null,
        createOrderDto.userId || 'system',
        this.dataSource.manager,
      );
    }

    // Disparar impresión automática para órdenes de delivery/pickup
    if (
      order.orderType === OrderType.DELIVERY ||
      order.orderType === OrderType.TAKE_AWAY
    ) {
      await this.automaticPrintingService.printOrderAutomatically(
        order.id,
        order.orderType,
        createOrderDto.userId || null, // Pasar null en lugar de 'system'
      );
    }

    return fullOrder;
  }

  // Método interno para crear OrderItem sin la lógica de modificadores (evita recursión)
  private async createOrderItemInternal(
    createOrderItemDto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    const order = await this.findOne(createOrderItemDto.orderId); // Verificar orden

    // Obtener el producto para copiar el preparationScreenId
    const product = await this.productRepository.findOne(
      createOrderItemDto.productId,
    );
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createOrderItemDto.productId} not found`,
      );
    }

    const orderItem = new OrderItem();
    orderItem.id = uuidv4();
    orderItem.orderId = createOrderItemDto.orderId;
    orderItem.productId = createOrderItemDto.productId;
    orderItem.productVariantId = createOrderItemDto.productVariantId || null;
    orderItem.basePrice = createOrderItemDto.basePrice;
    orderItem.finalPrice = createOrderItemDto.finalPrice;
    // Si la orden está en preparación o lista, crear el item en IN_PROGRESS
    if (
      order.orderStatus === OrderStatus.IN_PREPARATION ||
      order.orderStatus === OrderStatus.READY
    ) {
      orderItem.preparationStatus = PreparationStatus.IN_PROGRESS;
    } else {
      orderItem.preparationStatus = PreparationStatus.PENDING;
    }
    orderItem.statusChangedAt = new Date();
    orderItem.preparationNotes = createOrderItemDto.preparationNotes || null;
    orderItem.productModifiers = createOrderItemDto.productModifiers
      ? createOrderItemDto.productModifiers.map(
          (modifier) => ({ id: modifier.modifierId }) as any,
        )
      : [];

    // Mapear las personalizaciones de pizza si existen
    if (createOrderItemDto.selectedPizzaCustomizations) {
      orderItem.selectedPizzaCustomizations =
        createOrderItemDto.selectedPizzaCustomizations.map(
          (customization) =>
            ({
              id: uuidv4(),
              orderItemId: orderItem.id,
              pizzaCustomizationId: customization.pizzaCustomizationId,
              half: customization.half,
              action: customization.action,
            }) as any,
        );
    }

    return this.orderItemRepository.save(orderItem);
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      // Lanzar NotFoundException en lugar de Error genérico
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const existingOrder = await this.findOne(id);

      // Capturar estado anterior para el historial
      const previousOrderEntity = await manager.findOne(OrderEntity, {
        where: { id },
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

      // Manejar la creación de mesa temporal si es necesario
      let newTableId = updateOrderDto.tableId;
      if (
        updateOrderDto.isTemporaryTable &&
        updateOrderDto.temporaryTableName &&
        updateOrderDto.temporaryTableAreaId
      ) {
        // Crear mesa temporal
        const temporaryTable = await this.tablesService.create({
          name: updateOrderDto.temporaryTableName,
          areaId: updateOrderDto.temporaryTableAreaId,
          isTemporary: true,
          temporaryIdentifier: uuidv4(),
          isActive: true,
          isAvailable: false,
          capacity: 4,
        });
        newTableId = temporaryTable.id;
      }

      // Actualizar datos básicos de la orden
      const updatePayload: Partial<OrderEntity> = {};

      // Solo incluir campos que realmente cambiaron
      if (
        updateOrderDto.userId !== undefined &&
        updateOrderDto.userId !== existingOrder.userId
      )
        updatePayload.userId = updateOrderDto.userId;
      if (newTableId !== undefined && newTableId !== existingOrder.tableId) {
        updatePayload.tableId = newTableId;

        // Manejar cambio de mesa: liberar la anterior y ocupar la nueva
        // Solo si la orden no está finalizada
        if (
          existingOrder.orderStatus !== OrderStatus.COMPLETED &&
          existingOrder.orderStatus !== OrderStatus.CANCELLED
        ) {
          // Liberar mesa anterior si existía
          if (existingOrder.tableId) {
            const oldTable = await this.tablesService.findOne(
              existingOrder.tableId,
            );

            if (oldTable.isTemporary) {
              // Eliminar mesa temporal
              await this.tablesService.remove(existingOrder.tableId);
            } else {
              // Liberar mesa normal
              await this.tablesService.update(existingOrder.tableId, {
                isAvailable: true,
              });
            }
          }

          // Ocupar nueva mesa si se especificó
          if (newTableId) {
            // Verificar que la mesa esté disponible (solo si no es temporal, ya que las temporales ya se crean ocupadas)
            if (!updateOrderDto.isTemporaryTable) {
              const newTable = await this.tablesService.findOne(newTableId);
              if (!newTable.isAvailable) {
                throw new BadRequestException(
                  `La mesa ${newTable.name} no está disponible`,
                );
              }

              await this.tablesService.update(newTableId, {
                isAvailable: false,
              });
            }
          }
        }
      }
      if (
        updateOrderDto.scheduledAt !== undefined &&
        new Date(updateOrderDto.scheduledAt).getTime() !==
          new Date(existingOrder.scheduledAt || 0).getTime()
      )
        updatePayload.scheduledAt = updateOrderDto.scheduledAt;
      if (
        updateOrderDto.orderStatus !== undefined &&
        updateOrderDto.orderStatus !== existingOrder.orderStatus
      ) {
        updatePayload.orderStatus = updateOrderDto.orderStatus;

        // Si la orden se está completando o cancelando, establecer finalizedAt y liberar la mesa
        if (
          updateOrderDto.orderStatus === OrderStatus.COMPLETED ||
          updateOrderDto.orderStatus === OrderStatus.CANCELLED
        ) {
          updatePayload.finalizedAt = new Date();

          // Liberar la mesa si existe
          if (existingOrder.tableId) {
            // Verificar si es una mesa temporal
            const table = await this.tablesService.findOne(
              existingOrder.tableId,
            );

            if (table.isTemporary) {
              // Eliminar mesa temporal
              await this.tablesService.remove(existingOrder.tableId);
            } else {
              // Liberar mesa normal
              await this.tablesService.update(existingOrder.tableId, {
                isAvailable: true,
              });
            }
          }
        }
      }
      if (
        updateOrderDto.orderType !== undefined &&
        updateOrderDto.orderType !== existingOrder.orderType
      ) {
        updatePayload.orderType = updateOrderDto.orderType;

        // Si se cambia de DINE_IN a otro tipo, liberar la mesa
        if (
          existingOrder.orderType === OrderType.DINE_IN &&
          updateOrderDto.orderType !== OrderType.DINE_IN
        ) {
          // Limpiar tableId cuando se cambia de DINE_IN a otro tipo
          updatePayload.tableId = null;

          // Solo intentar liberar la mesa si existe y la orden no está terminada
          if (
            existingOrder.tableId &&
            existingOrder.orderStatus !== OrderStatus.COMPLETED &&
            existingOrder.orderStatus !== OrderStatus.CANCELLED
          ) {
            try {
              // Verificar si es mesa temporal
              const table = await this.tablesService.findOne(
                existingOrder.tableId,
              );

              if (table.isTemporary) {
                // Eliminar mesa temporal
                await this.tablesService.remove(existingOrder.tableId);
              } else {
                // Liberar mesa normal
                await this.tablesService.update(existingOrder.tableId, {
                  isAvailable: true,
                });
              }
            } catch (error) {
              this.logger.error(
                `Error al liberar mesa ${existingOrder.tableId}:`,
                error,
              );
              // Continuar con la actualización aunque haya error con la mesa
            }
          }
        }

        // Si se cambia de DELIVERY/TAKEAWAY a DINE_IN, asegurar que tableId se maneje correctamente
        if (
          (existingOrder.orderType === OrderType.DELIVERY ||
            existingOrder.orderType === OrderType.TAKE_AWAY) &&
          updateOrderDto.orderType === OrderType.DINE_IN
        ) {
          // El tableId se maneja en la lógica general de actualización
        }
      }
      if (
        updateOrderDto.subtotal !== undefined &&
        Number(updateOrderDto.subtotal) !== Number(existingOrder.subtotal)
      )
        updatePayload.subtotal = updateOrderDto.subtotal;
      if (
        updateOrderDto.total !== undefined &&
        Number(updateOrderDto.total) !== Number(existingOrder.total)
      )
        updatePayload.total = updateOrderDto.total;
      if (
        updateOrderDto.notes !== undefined &&
        updateOrderDto.notes !== existingOrder.notes
      )
        updatePayload.notes = updateOrderDto.notes;
      if (
        updateOrderDto.customerId !== undefined &&
        updateOrderDto.customerId !== existingOrder.customerId
      )
        updatePayload.customerId = updateOrderDto.customerId;

      // Determinar el tipo de orden final (nuevo o existente)
      const finalOrderType =
        updateOrderDto.orderType || existingOrder.orderType;

      // Separar deliveryInfo del payload básico para evitar errores de TypeORM
      const hasDeliveryInfoChanges = 'deliveryInfo' in updateOrderDto;
      const { deliveryInfo: _, ...basicUpdatePayload } = updatePayload;
      if (Object.keys(basicUpdatePayload).length > 0) {
        await manager.update(OrderEntity, id, basicUpdatePayload);
      }

      // Manejar deliveryInfo por separado
      if (hasDeliveryInfoChanges) {
        await this._updateDeliveryInfo(manager, id, updateOrderDto, finalOrderType, existingOrder);
      }

      // Procesar items si se proporcionaron
      if (
        updateOrderDto.items !== undefined &&
        Array.isArray(updateOrderDto.items)
      ) {
        // Obtener items existentes
        const existingItems = await this.orderItemRepository.findByOrderId(id);
        const existingItemsMap = new Map(
          existingItems.map((item) => [item.id, item]),
        );

        const itemsToUpdate = new Set<string>();
        const itemsToDelete = new Set(existingItemsMap.keys());
        let hasNewItems = false;

        for (const itemDto of updateOrderDto.items) {
          if (itemDto.id) {
            if (itemDto.id.includes(',')) {
              // Grupo de items concatenados
              const itemIds = itemDto.id.split(',').filter((id) => id.trim());
              const existingGroupItems = itemIds.filter((id) =>
                existingItemsMap.has(id),
              );
              const nonExistingCount =
                itemIds.length - existingGroupItems.length;

              // Actualizar items existentes del grupo
              for (const singleItemId of existingGroupItems) {
                itemsToUpdate.add(singleItemId);
                itemsToDelete.delete(singleItemId);

                await this.updateOrderItem(singleItemId, {
                  productId: itemDto.productId,
                  productVariantId: itemDto.productVariantId,
                  basePrice: itemDto.basePrice,
                  finalPrice: itemDto.finalPrice,
                  preparationNotes: itemDto.preparationNotes,
                  productModifiers: itemDto.productModifiers,
                  selectedPizzaCustomizations:
                    itemDto.selectedPizzaCustomizations,
                });
              }

              // Crear items faltantes
              for (let i = 0; i < nonExistingCount; i++) {
                const createOrderItemDto: CreateOrderItemDto = {
                  orderId: id,
                  productId: itemDto.productId,
                  productVariantId: itemDto.productVariantId,
                  basePrice: itemDto.basePrice,
                  finalPrice: itemDto.finalPrice,
                  preparationNotes: itemDto.preparationNotes,
                  productModifiers: itemDto.productModifiers,
                  selectedPizzaCustomizations:
                    itemDto.selectedPizzaCustomizations,
                };

                await this.createOrderItemInternal(createOrderItemDto);
                hasNewItems = true;
              }
            } else if (existingItemsMap.has(itemDto.id)) {
              itemsToUpdate.add(itemDto.id);
              itemsToDelete.delete(itemDto.id);

              await this.updateOrderItem(itemDto.id, {
                productId: itemDto.productId,
                productVariantId: itemDto.productVariantId,
                basePrice: itemDto.basePrice,
                finalPrice: itemDto.finalPrice,
                preparationNotes: itemDto.preparationNotes,
                productModifiers: itemDto.productModifiers,
                selectedPizzaCustomizations:
                  itemDto.selectedPizzaCustomizations,
              });
            } else {
              const createOrderItemDto: CreateOrderItemDto = {
                orderId: id,
                productId: itemDto.productId,
                productVariantId: itemDto.productVariantId,
                basePrice: itemDto.basePrice,
                finalPrice: itemDto.finalPrice,
                preparationNotes: itemDto.preparationNotes,
                productModifiers: itemDto.productModifiers,
                selectedPizzaCustomizations:
                  itemDto.selectedPizzaCustomizations,
              };

              await this.createOrderItemInternal(createOrderItemDto);
              hasNewItems = true;
            }
          } else {
            const createOrderItemDto: CreateOrderItemDto = {
              orderId: id,
              productId: itemDto.productId,
              productVariantId: itemDto.productVariantId,
              basePrice: itemDto.basePrice,
              finalPrice: itemDto.finalPrice,
              preparationNotes: itemDto.preparationNotes,
              productModifiers: itemDto.productModifiers,
              selectedPizzaCustomizations: itemDto.selectedPizzaCustomizations,
            };

            await this.createOrderItemInternal(createOrderItemDto);
            hasNewItems = true;
          }
        }

        // Eliminar items que no están en el DTO actualizado
        const hasDeletedItems = itemsToDelete.size > 0;
        for (const itemIdToDelete of itemsToDelete) {
          await this.orderItemRepository.delete(itemIdToDelete);
        }

        // Sincronizar estados de pantallas si hubo cambios en los items
        if (hasNewItems || hasDeletedItems) {
          await this.syncPreparationScreenStatuses(id, existingOrder);
        }
      }

      // Manejar ajustes si se proporcionaron
      if (
        updateOrderDto.adjustments !== undefined &&
        updateOrderDto.adjustments !== null
      ) {
        await this.dataSource.manager.transaction(async (manager) => {
          // Eliminar todos los ajustes existentes de la orden
          await manager.delete('adjustment', { orderId: id });

          // Crear los nuevos ajustes
          for (const adj of updateOrderDto.adjustments!) {
            if (!adj.isDeleted) {
              await manager.save('adjustment', {
                orderId: id,
                name: adj.name,
                isPercentage: adj.isPercentage || false,
                value: adj.value || 0,
                amount: adj.amount || 0,
                appliedAt: new Date(),
                appliedById:
                  updateOrderDto.userId || existingOrder.userId || 'system',
              });
            }
          }
        });
      }

      // Obtener el estado actual después de los cambios con todas las relaciones
      const currentOrderEntity = await manager.findOne(OrderEntity, {
        where: { id },
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

      // Registrar historial de cambios dentro de la misma transacción
      if (previousOrderEntity && currentOrderEntity) {
        const currentUser = this.userContextService.getCurrentUser();
        const changedBy =
          currentUser?.userId || updateOrderDto.userId || 'system';

        await this.orderChangeTracker.trackOrderWithItems(
          'UPDATE',
          currentOrderEntity,
          previousOrderEntity,
          changedBy,
          manager,
        );
      }

      // Detectar cambios estructurales para la impresión automática
      let hasRealChanges = false;
      if (previousOrderEntity && currentOrderEntity) {
        hasRealChanges = this.orderChangeTracker.detectStructuralChangesOnly(
          currentOrderEntity,
          previousOrderEntity,
        );
      }

      // Recargar la orden completa para el retorno (fuera de la transacción para mejor rendimiento)
      const updatedOrder = await this.findOne(id);

      // Imprimir automáticamente si hay cambios estructurales
      if (hasRealChanges) {
        await this.automaticPrintingService.printOrderAutomatically(
          updatedOrder.id,
          updatedOrder.orderType,
          updateOrderDto.userId || null,
          true,
        );
      }

      return updatedOrder;
    }); // Fin de la transacción
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.orderRepository.remove(id);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async findByTableId(tableId: string): Promise<Order[]> {
    return this.orderRepository.findByTableId(tableId);
  }

  async findByShiftId(shiftId: string): Promise<Order[]> {
    const orders = await this.orderRepository.findByShiftId(shiftId);
    return orders;
  }

  async findOpenOrders(): Promise<Order[]> {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      // Si no hay turno abierto, devolver array vacío
      return [];
    }

    // Buscar órdenes abiertas dentro del rango del turno
    const openOrders = await this.orderRepository.findByDateRange(
      currentShift.openedAt,
      new Date(), // Hasta ahora
    );

    // Filtrar solo las órdenes que no están completadas o canceladas
    return openOrders.filter(
      (order) =>
        order.orderStatus !== OrderStatus.COMPLETED &&
        order.orderStatus !== OrderStatus.CANCELLED,
    );
  }

  async findOpenOrdersOptimized(): Promise<OrderOpenListDto[]> {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      return [];
    }

    // Usar una consulta optimizada que solo trae los campos necesarios
    const orders = await this.orderRepository.findOpenOrdersOptimized(
      currentShift.openedAt,
      new Date(),
    );

    // Mapear a DTO con el campo createdBy
    return orders.map((order) => this.mapToOpenListDto(order));
  }

  // OrderItem methods
  // Este método ahora solo crea el item, los modificadores se manejan en 'create'
  async createOrderItem(
    createOrderItemDto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    return this.createOrderItemInternal(createOrderItemDto);
  }

  async findOrderItemById(id: string): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findById(id);

    if (!orderItem) {
      throw new NotFoundException(`OrderItem with ID ${id} not found`);
    }

    return orderItem;
  }

  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    await this.findOne(orderId); // Verificar que la orden existe
    return this.orderItemRepository.findByOrderId(orderId);
  }

  private cleanDeliveryInfoByOrderType(
    deliveryInfo: Partial<DeliveryInfo>,
    orderType: OrderType,
  ): any {
    const result: any = {};
    const allFields = [
      'fullAddress',
      'street',
      'number',
      'interiorNumber',
      'neighborhood',
      'city',
      'state',
      'zipCode',
      'country',
      'latitude',
      'longitude',
      'recipientName',
      'recipientPhone',
      'deliveryInstructions',
    ];

    if (orderType === OrderType.DINE_IN) {
      allFields.forEach((field) => (result[field] = undefined));
      return result;
    }

    const getValue = (field: keyof DeliveryInfo) => {
      const value = deliveryInfo[field];
      return value !== undefined && value !== null && value !== ''
        ? value
        : undefined;
    };

    if (orderType === OrderType.TAKE_AWAY) {
      result.recipientName = getValue('recipientName');
      result.recipientPhone = getValue('recipientPhone');
      result.deliveryInstructions = getValue('deliveryInstructions');

      [
        'fullAddress',
        'street',
        'number',
        'interiorNumber',
        'neighborhood',
        'city',
        'state',
        'zipCode',
        'country',
        'latitude',
        'longitude',
      ].forEach((field) => (result[field] = null));

      return result;
    }

    if (orderType === OrderType.DELIVERY) {
      [
        'fullAddress',
        'street',
        'number',
        'interiorNumber',
        'neighborhood',
        'city',
        'state',
        'zipCode',
        'country',
        'deliveryInstructions',
        'recipientPhone',
      ].forEach(
        (field) => (result[field] = getValue(field as keyof DeliveryInfo)),
      );

      result.latitude =
        deliveryInfo.latitude !== undefined && deliveryInfo.latitude !== null
          ? deliveryInfo.latitude
          : undefined;
      result.longitude =
        deliveryInfo.longitude !== undefined && deliveryInfo.longitude !== null
          ? deliveryInfo.longitude
          : undefined;
      result.recipientName = null;

      return result;
    }

    allFields.forEach((field) => (result[field] = undefined));
    return result;
  }

  // Función helper para comparar deliveryInfo
  private hasDeliveryInfoChanges(
    existing: DeliveryInfo | null | undefined,
    updated: Partial<DeliveryInfo>,
  ): boolean {
    // Si no existe y se está creando uno nuevo con campos
    if (!existing && updated) {
      const hasAnyValue = Object.values(updated).some(
        (value) => value !== undefined && value !== null && value !== '',
      );
      return hasAnyValue;
    }

    // Si existe pero se está eliminando
    if (existing && !updated) {
      return true;
    }

    // Si ambos no existen, no hay cambios
    if (!existing && !updated) {
      return false;
    }

    // Comparar cada campo, incluyendo todos los campos de dirección
    const fieldsToCompare = [
      'recipientName',
      'recipientPhone',
      'fullAddress',
      'street',
      'number',
      'interiorNumber',
      'neighborhood',
      'city',
      'state',
      'zipCode',
      'country',
      'deliveryInstructions',
      'latitude',
      'longitude',
    ];

    for (const field of fieldsToCompare) {
      const existingValue = existing?.[field as keyof DeliveryInfo];
      const updatedValue = updated[field as keyof DeliveryInfo];

      // Normalizar valores: tratar null, undefined y string vacío como equivalentes
      const normalizedExisting =
        existingValue === null || existingValue === ''
          ? undefined
          : existingValue;
      const normalizedUpdated =
        updatedValue === null || updatedValue === '' ? undefined : updatedValue;

      // Si los valores normalizados son diferentes, hay cambio
      if (normalizedExisting !== normalizedUpdated) {
        return true;
      }
    }

    return false;
  }

  // Función helper para comparar si dos order items son iguales
  private areOrderItemsEqual(
    existingItem: OrderItem,
    updateDto: UpdateOrderItemDto,
  ): boolean {
    // Comparar campos básicos (comparando precios como números)
    const basicFieldsEqual =
      (updateDto.productId === undefined ||
        existingItem.productId === updateDto.productId) &&
      (updateDto.productVariantId === undefined ||
        existingItem.productVariantId === updateDto.productVariantId) &&
      (updateDto.basePrice === undefined ||
        Number(existingItem.basePrice) === Number(updateDto.basePrice)) &&
      (updateDto.finalPrice === undefined ||
        Number(existingItem.finalPrice) === Number(updateDto.finalPrice)) &&
      (updateDto.preparationNotes === undefined ||
        existingItem.preparationNotes === updateDto.preparationNotes ||
        (existingItem.preparationNotes === null &&
          updateDto.preparationNotes === '') ||
        (existingItem.preparationNotes === '' &&
          updateDto.preparationNotes === null));

    if (!basicFieldsEqual) {
      return false;
    }

    // Comparar modificadores
    if (updateDto.productModifiers !== undefined) {
      const existingModifierIds =
        existingItem.productModifiers
          ?.map((m) => (typeof m === 'object' && m.id ? m.id : m))
          .sort() || [];
      const newModifierIds = updateDto.productModifiers
        .map((m) => m.modifierId)
        .sort();

      if (
        JSON.stringify(existingModifierIds) !== JSON.stringify(newModifierIds)
      ) {
        return false;
      }
    }

    // Comparar personalizaciones de pizza
    if (updateDto.selectedPizzaCustomizations !== undefined) {
      const existingCustomizations =
        existingItem.selectedPizzaCustomizations || [];
      const newCustomizations = updateDto.selectedPizzaCustomizations;

      if (existingCustomizations.length !== newCustomizations.length) {
        return false;
      }

      // Ordenar y comparar por pizzaCustomizationId, half y action
      const sortedExisting = existingCustomizations
        .map((c) => ({
          pizzaCustomizationId: c.pizzaCustomizationId,
          half: c.half,
          action: c.action,
        }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

      const sortedNew = newCustomizations
        .map((c) => ({
          pizzaCustomizationId: c.pizzaCustomizationId,
          half: c.half,
          action: c.action,
        }))
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

      if (JSON.stringify(sortedExisting) !== JSON.stringify(sortedNew)) {
        return false;
      }
    }

    return true;
  }

  async updateOrderItem(
    id: string,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const existingOrderItem = await this.findOrderItemById(id);

    // Verificar si realmente hay cambios
    if (this.areOrderItemsEqual(existingOrderItem, updateOrderItemDto)) {
      return existingOrderItem;
    }

    // Guardar una copia del estado anterior antes de actualizar
    // Esto es necesario porque el subscriber de TypeORM recibe la entidad ya modificada

    // Crear un objeto con los datos actualizados
    const updatedData = {
      ...existingOrderItem, // Copiar datos existentes
      productId: updateOrderItemDto.productId ?? existingOrderItem.productId,
      productVariantId:
        updateOrderItemDto.productVariantId ??
        existingOrderItem.productVariantId,
      basePrice: updateOrderItemDto.basePrice ?? existingOrderItem.basePrice,
      finalPrice: updateOrderItemDto.finalPrice ?? existingOrderItem.finalPrice,
      preparationStatus:
        updateOrderItemDto.preparationStatus ??
        existingOrderItem.preparationStatus,
      statusChangedAt: updateOrderItemDto.preparationStatus
        ? new Date()
        : existingOrderItem.statusChangedAt,
      preparationNotes:
        updateOrderItemDto.preparationNotes !== undefined
          ? updateOrderItemDto.preparationNotes
          : existingOrderItem.preparationNotes,
    };

    // Crear instancia y asignar propiedades
    const updatedOrderItem = new OrderItem();
    updatedOrderItem.id = updatedData.id;
    updatedOrderItem.orderId = updatedData.orderId; // Este es crítico para el historial
    updatedOrderItem.productId = updatedData.productId;
    updatedOrderItem.productVariantId = updatedData.productVariantId;
    updatedOrderItem.basePrice = updatedData.basePrice;
    updatedOrderItem.finalPrice = updatedData.finalPrice;
    updatedOrderItem.preparationStatus = updatedData.preparationStatus;
    updatedOrderItem.statusChangedAt = updatedData.statusChangedAt;
    updatedOrderItem.preparationNotes = updatedData.preparationNotes;

    // Preservar campos que no están en el DTO de actualización
    updatedOrderItem.preparedAt = existingOrderItem.preparedAt;
    updatedOrderItem.preparedById = existingOrderItem.preparedById;

    // Asignar relaciones y timestamps existentes si es necesario para el repositorio
    updatedOrderItem.order = existingOrderItem.order;
    updatedOrderItem.product = existingOrderItem.product;
    updatedOrderItem.productVariant = existingOrderItem.productVariant;
    updatedOrderItem.productModifiers = updateOrderItemDto.productModifiers
      ? updateOrderItemDto.productModifiers.map(
          (modifier) => ({ id: modifier.modifierId }) as any,
        )
      : existingOrderItem.productModifiers;

    // Manejar las personalizaciones de pizza de manera inteligente
    if (updateOrderItemDto.selectedPizzaCustomizations !== undefined) {
      const existingCustomizations =
        existingOrderItem.selectedPizzaCustomizations || [];
      const newCustomizations = updateOrderItemDto.selectedPizzaCustomizations;

      // Crear un mapa de las personalizaciones existentes para reutilizar IDs cuando sea posible
      const existingMap = new Map(
        existingCustomizations.map((c) => [
          `${c.pizzaCustomizationId}-${c.half}-${c.action}`,
          c.id,
        ]),
      );

      // Mapear las nuevas personalizaciones, reutilizando IDs cuando sea posible
      updatedOrderItem.selectedPizzaCustomizations = newCustomizations.map(
        (customization) => {
          const key = `${customization.pizzaCustomizationId}-${customization.half}-${customization.action}`;
          const existingId = existingMap.get(key);

          return {
            id: existingId || uuidv4(), // Reutilizar ID si existe una personalización idéntica
            orderItemId: updatedOrderItem.id,
            pizzaCustomizationId: customization.pizzaCustomizationId,
            half: customization.half,
            action: customization.action,
          } as any;
        },
      );
    } else {
      // Si no se proporcionan, mantener las existentes
      updatedOrderItem.selectedPizzaCustomizations =
        existingOrderItem.selectedPizzaCustomizations;
    }

    updatedOrderItem.createdAt = existingOrderItem.createdAt;
    // updatedAt y deletedAt serán manejados por TypeORM o el repositorio
    updatedOrderItem.deletedAt = existingOrderItem.deletedAt;

    return this.orderItemRepository.update(updatedOrderItem);
  }

  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.findOrderItemById(id);

    // La eliminación de las relaciones Many-to-Many se maneja automáticamente por TypeORM
    // al eliminar el order item, las relaciones en order_item_product_modifiers se eliminan en cascada

    await this.orderItemRepository.delete(orderItem.id);
  }

  // --- Ticket Impression Methods ---

  async registerTicketImpression(
    orderId: string,
    userId: string,
    ticketType: TicketType,
    printerId?: string,
  ): Promise<TicketImpression> {
    await this.findOne(orderId); // Verificar orden

    const impressionData = {
      orderId,
      userId,
      ticketType,
      printerId,
      impressionTime: new Date(),
    };
    return this.ticketImpressionRepository.create(impressionData);
  }

  async findImpressionsByOrderId(orderId: string): Promise<TicketImpression[]> {
    await this.findOne(orderId); // Verificar orden
    return this.ticketImpressionRepository.findByOrderId(orderId);
  }

  async recoverOrder(id: string): Promise<Order> {
    // Verificar que la orden existe y está en estado recuperable
    const order = await this.findOne(id);
    
    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    if (
      order.orderStatus !== OrderStatus.COMPLETED &&
      order.orderStatus !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `La orden no está en un estado recuperable. Estado actual: ${order.orderStatus}`,
      );
    }

    // Actualizar directamente a estado READY
    return this.update(id, { orderStatus: OrderStatus.READY });
  }

  async findOrdersForFinalizationList(): Promise<
    OrderForFinalizationListDto[]
  > {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      return [];
    }

    const orders = await this.dataSource.getRepository(OrderEntity).find({
      where: {
        shiftId: currentShift.id,
        orderStatus: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED])),
      },
      relations: [
        'user',
        'table',
        'table.area',
        'payments',
        'deliveryInfo',
        'preparationScreenStatuses',
        'preparationScreenStatuses.preparationScreen',
        'ticketImpressions',
      ],
      select: {
        id: true,
        shiftOrderNumber: true,
        orderType: true,
        orderStatus: true,
        total: true,
        createdAt: true,
        scheduledAt: true,
        notes: true,
        isFromWhatsApp: true,
        user: {
          username: true,
          firstName: true,
          lastName: true,
        },
        table: {
          id: true,
          name: true,
          area: {
            id: true,
            name: true,
          },
        },
        payments: {
          id: true,
          amount: true,
        },
        deliveryInfo: {
          id: true,
          recipientName: true,
          recipientPhone: true,
          fullAddress: true,
        },
        orderItems: {
          id: true,
          product: {
            id: true,
            preparationScreen: {
              id: true,
              name: true,
            },
          },
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return orders.map((order) => this.mapToFinalizationListDto(order));
  }

  async findOrderForFinalizationById(
    id: string,
  ): Promise<OrderForFinalizationDto> {
    const order = await this.orderRepository.findOrderForFinalizationById(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrderToFinalizationDto(order);
  }

  private mapOrderToFinalizationDto(order: Order): OrderForFinalizationDto {
    const groupedItems = new Map<
      string,
      {
        items: OrderItem[];
        modifiers: any[];
      }
    >();

    order.orderItems.forEach((item) => {
      // Crear clave única basada en producto, variante, modificadores y notas
      const modifierKeys =
        item.productModifiers
          ?.map((m) => m.id)
          .sort()
          .join(',') || '';
      const key = `${item.productId}-${item.productVariantId || ''}-${modifierKeys}-${item.preparationNotes || ''}-${item.preparationStatus}`;

      if (!groupedItems.has(key)) {
        groupedItems.set(key, {
          items: [],
          modifiers: item.productModifiers || [],
        });
      }

      groupedItems.get(key)!.items.push(item);
    });

    const orderItemDtos: OrderItemForFinalizationDto[] = [];

    groupedItems.forEach(({ items, modifiers }) => {
      const firstItem = items[0];

      const dto: OrderItemForFinalizationDto = {
        productId: firstItem.productId,
        productVariantId: firstItem.productVariantId || undefined,
        quantity: items.length,
        basePrice: firstItem.basePrice,
        finalPrice: firstItem.finalPrice,
        preparationNotes: firstItem.preparationNotes || undefined,
        preparationStatus: firstItem.preparationStatus,
        product: firstItem.product
          ? {
              id: firstItem.product.id,
              name: firstItem.product.name,
              description: firstItem.product.description || undefined,
            }
          : {
              id: firstItem.productId,
              name: 'Producto no encontrado',
              description: undefined,
            },
        productVariant: firstItem.productVariant
          ? {
              id: firstItem.productVariant.id,
              name: firstItem.productVariant.name,
            }
          : undefined,
        modifiers: modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
        })),
        selectedPizzaCustomizations:
          firstItem.selectedPizzaCustomizations || undefined,
      };

      orderItemDtos.push(dto);
    });

    const orderDto: OrderForFinalizationDto = {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: order.total,
      orderItems: orderItemDtos,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      scheduledAt: order.scheduledAt || undefined,
      tableId: order.tableId || undefined,
      user: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName || undefined,
            lastName: order.user.lastName || undefined,
          }
        : undefined,
      table: order.table
        ? {
            id: order.table.id,
            number: order.table.name, // Mapear 'name' a 'number' como espera el DTO
            area: order.table.area
              ? {
                  name: order.table.area.name,
                }
              : undefined,
          }
        : undefined,
      deliveryInfo: order.deliveryInfo || undefined,
      isFromWhatsApp: order.isFromWhatsApp,
      payments:
        order.payments?.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })) || undefined,
      preparationScreenStatuses: order.preparationScreenStatuses?.map(
        (status) => ({
          id: status.id,
          preparationScreenId: status.preparationScreenId,
          preparationScreenName:
            status.preparationScreen?.name || 'Pantalla desconocida',
          status: status.status.toString(),
          startedAt: status.startedAt ? status.startedAt.toISOString() : null,
          completedAt: status.completedAt
            ? status.completedAt.toISOString()
            : null,
        }),
      ),
      ticketImpressions:
        order.ticketImpressions?.map((impression) => ({
          id: impression.id,
          ticketType: impression.ticketType,
          impressionTime: impression.impressionTime,
          user: impression.user
            ? {
                id: impression.user.id,
                firstName: impression.user.firstName || undefined,
                lastName: impression.user.lastName || undefined,
              }
            : undefined,
          printer: impression.printer
            ? {
                id: impression.printer.id,
                name: impression.printer.name,
              }
            : undefined,
        })) || undefined,
    };

    return orderDto;
  }

  async getReceiptDetail(id: string): Promise<any> {
    const order = await this.dataSource.getRepository(OrderEntity).findOne({
      where: {
        id,
        orderStatus: In([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
      },
      relations: [
        'user',
        'table',
        'table.area',
        'deliveryInfo',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'orderItems.productModifiers',
        'payments',
        'preparationScreenStatuses',
        'preparationScreenStatuses.preparationScreen',
        'ticketImpressions',
        'ticketImpressions.user',
        'ticketImpressions.printer',
      ],
    });

    if (!order) {
      throw new NotFoundException('Recibo no encontrado');
    }

    return {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      finalizedAt: order.finalizedAt || undefined,
      scheduledAt: order.scheduledAt || undefined,
      notes: order.notes || undefined,
      user: order.user
        ? {
            id: order.user.id,
            firstName: order.user.firstName || undefined,
            lastName: order.user.lastName || undefined,
            username: order.user.username,
          }
        : undefined,
      table: order.table
        ? {
            id: order.table.id,
            number: order.table.name,
            name: order.table.name,
            isTemporary: order.table.isTemporary,
            area: order.table.area
              ? {
                  id: order.table.area.id,
                  name: order.table.area.name,
                }
              : undefined,
          }
        : undefined,
      deliveryInfo: order.deliveryInfo || undefined,
      orderItems:
        order.orderItems?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          basePrice: Number(item.basePrice),
          finalPrice: Number(item.finalPrice),
          preparationNotes: item.preparationNotes || undefined,
          preparationStatus: item.preparationStatus || undefined,
          product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description || undefined,
            price: Number(item.product.price),
          },
          productVariant: item.productVariant
            ? {
                id: item.productVariant.id,
                name: item.productVariant.name,
                price: Number(item.productVariant.price),
              }
            : undefined,
          productModifiers:
            item.productModifiers?.map((mod: any) => ({
              id: mod.id,
              name: mod.name,
              price: Number(mod.price),
            })) || undefined,
          selectedPizzaCustomizations:
            item.selectedPizzaCustomizations?.map((custom: any) => ({
              pizzaCustomizationId: custom.pizzaCustomizationId,
              half: custom.half,
              action: custom.action,
              pizzaCustomization: custom.pizzaCustomization
                ? {
                    id: custom.pizzaCustomization.id,
                    name: custom.pizzaCustomization.name,
                    type: custom.pizzaCustomization.type,
                  }
                : undefined,
            })) || undefined,
        })) || [],
      payments:
        order.payments?.map((payment: any) => ({
          id: payment.id,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        })) || undefined,
      ticketImpressions:
        order.ticketImpressions?.map((impression: any) => ({
          id: impression.id,
          ticketType: impression.ticketType,
          impressionTime: impression.impressionTime,
          user: impression.user
            ? {
                id: impression.user.id,
                firstName: impression.user.firstName || undefined,
                lastName: impression.user.lastName || undefined,
              }
            : undefined,
          printer: impression.printer
            ? {
                id: impression.printer.id,
                name: impression.printer.name,
              }
            : undefined,
        })) || undefined,
    };
  }

  private mapToFinalizationListDto(order: any): OrderForFinalizationListDto {
    const totalPaid =
      order.payments?.reduce(
        (sum: number, payment: any) => sum + Number(payment.amount),
        0,
      ) || 0;

    // Usar la relación directa de preparationScreenStatuses de la orden
    const preparationScreenStatuses =
      order.preparationScreenStatuses?.map((status: any) => ({
        id: status.id,
        preparationScreenId: status.preparationScreenId,
        preparationScreenName:
          status.preparationScreen?.name || 'Pantalla desconocida',
        status: status.status.toString(),
        startedAt: status.startedAt ? status.startedAt.toISOString() : null,
        completedAt: status.completedAt
          ? status.completedAt.toISOString()
          : null,
      })) || [];

    const dto: OrderForFinalizationListDto = {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: Number(order.total),
      createdAt: order.createdAt,
      scheduledAt: order.scheduledAt || undefined,
      isFromWhatsApp: order.isFromWhatsApp,
      paymentsSummary: {
        totalPaid,
      },
    };

    if (preparationScreenStatuses.length > 0) {
      dto.preparationScreenStatuses = preparationScreenStatuses;
    }

    if (order.table) {
      dto.table = {
        number: order.table.name,
        area: order.table.area
          ? {
              name: order.table.area.name,
            }
          : undefined,
      };
    }

    if (order.deliveryInfo) {
      dto.deliveryInfo = {
        recipientName: order.deliveryInfo.recipientName || undefined,
        recipientPhone: order.deliveryInfo.recipientPhone || undefined,
        fullAddress: order.deliveryInfo.fullAddress || undefined,
      };
    }

    if (order.ticketImpressions && order.ticketImpressions.length > 0) {
      dto.ticketImpressionCount = order.ticketImpressions.length;
    }

    if (order.notes) {
      dto.notes = order.notes;
    }

    // Agregar información del usuario creador
    if (order.user) {
      dto.createdBy = {
        username: order.user.username || 'Usuario',
        firstName: order.user.firstName || null,
        lastName: order.user.lastName || null,
      };
    } else if (order.isFromWhatsApp) {
      dto.createdBy = {
        username: 'WhatsApp',
        firstName: 'Orden de',
        lastName: 'WhatsApp',
      };
    }

    return dto;
  }

  private mapToReceiptListDto(order: any): ReceiptListDto {
    const totalPaid =
      order.payments?.reduce(
        (sum: number, payment: any) =>
          payment.paymentStatus === 'COMPLETED'
            ? sum + Number(payment.amount)
            : sum,
        0,
      ) || 0;

    // Usar la relación directa de preparationScreenStatuses de la orden
    const preparationScreenStatuses =
      order.preparationScreenStatuses?.map((status: any) => ({
        id: status.id,
        preparationScreenId: status.preparationScreenId,
        preparationScreenName:
          status.preparationScreen?.name || 'Pantalla desconocida',
        status: status.status.toString(),
        startedAt: status.startedAt ? status.startedAt.toISOString() : null,
        completedAt: status.completedAt
          ? status.completedAt.toISOString()
          : null,
      })) || [];

    const dto: ReceiptListDto = {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: Number(order.total),
      createdAt: order.createdAt,
      finalizedAt: order.finalizedAt,
      scheduledAt: order.scheduledAt || undefined,
      isFromWhatsApp: order.isFromWhatsApp,
      paymentsSummary: {
        totalPaid,
      },
    };

    // Agregar pantallas de preparación y sus estados
    if (preparationScreenStatuses.length > 0) {
      dto.preparationScreenStatuses = preparationScreenStatuses;
    }

    if (order.table) {
      dto.table = {
        id: order.table.id,
        number: order.table.number || order.table.name,
        name: order.table.name,
        isTemporary: order.table.isTemporary || false,
        area: order.table.area
          ? {
              name: order.table.area.name,
            }
          : undefined,
      };
    }

    if (order.deliveryInfo) {
      dto.deliveryInfo = {
        recipientName: order.deliveryInfo.recipientName || undefined,
        recipientPhone: order.deliveryInfo.recipientPhone || undefined,
        fullAddress: order.deliveryInfo.fullAddress || undefined,
      };
    }

    // Agregar contador de impresiones de tickets
    if (order.ticketImpressions && order.ticketImpressions.length > 0) {
      dto.ticketImpressionCount = order.ticketImpressions.length;
    }

    // Agregar notas si existen
    if (order.notes) {
      dto.notes = order.notes;
    }

    // Agregar información del usuario creador
    if (order.user) {
      dto.createdBy = {
        username: order.user.username || 'Usuario',
        firstName: order.user.firstName || null,
        lastName: order.user.lastName || null,
      };
    } else if (order.isFromWhatsApp) {
      // Si no hay usuario pero es de WhatsApp, indicarlo
      dto.createdBy = {
        username: 'WhatsApp',
        firstName: 'Orden de',
        lastName: 'WhatsApp',
      };
    }

    return dto;
  }

  private mapToOpenListDto(order: Order): OrderOpenListDto {
    const dto: OrderOpenListDto = {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: order.total,
      createdAt: order.createdAt,
      scheduledAt: order.scheduledAt || undefined,
      notes: order.notes,
      paymentsSummary: order.paymentsSummary,
      ticketImpressionCount: order.ticketImpressionCount,
      preparationScreenStatuses: order.preparationScreenStatuses?.map(
        (status) => ({
          id: status.id,
          preparationScreenId: status.preparationScreenId,
          preparationScreenName:
            status.preparationScreen?.name || 'Pantalla desconocida',
          status: status.status.toString(),
          startedAt: status.startedAt ? status.startedAt.toISOString() : null,
          completedAt: status.completedAt
            ? status.completedAt.toISOString()
            : null,
        }),
      ),
      isFromWhatsApp: order.isFromWhatsApp,
    };

    // Mapear tabla si existe
    if (order.table) {
      dto.table = {
        id: order.table.id,
        number: order.table.name, // En el dominio Table, 'name' contiene el número
        name: order.table.name,
        isTemporary: order.table.isTemporary,
        area: order.table.area
          ? {
              name: order.table.area.name,
            }
          : undefined,
      };
    }

    // Mapear deliveryInfo si existe
    if (order.deliveryInfo) {
      dto.deliveryInfo = {
        recipientName: order.deliveryInfo.recipientName || undefined,
        recipientPhone: order.deliveryInfo.recipientPhone || undefined,
        fullAddress: order.deliveryInfo.fullAddress || undefined,
      };
    }

    // Agregar información del usuario creador
    if (order.user) {
      dto.createdBy = {
        username: order.user.username || 'Usuario',
        firstName: order.user.firstName || null,
        lastName: order.user.lastName || null,
      };
    } else if (order.isFromWhatsApp) {
      // Si no hay usuario pero es de WhatsApp, indicarlo
      dto.createdBy = {
        username: 'WhatsApp',
        firstName: 'Orden de',
        lastName: 'WhatsApp',
      };
    }

    return dto;
  }

  async getReceiptsList(filterOptions?: {
    startDate?: Date;
    endDate?: Date;
    orderType?: OrderType;
  }): Promise<ReceiptListDto[]> {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      return [];
    }

    const orders = await this.dataSource.getRepository(OrderEntity).find({
      where: {
        shiftId: currentShift.id,
        orderStatus: In([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
        ...(filterOptions?.orderType && { orderType: filterOptions.orderType }),
        ...(filterOptions?.startDate &&
          filterOptions?.endDate && {
            finalizedAt: Between(
              filterOptions.startDate,
              filterOptions.endDate,
            ),
          }),
      },
      relations: [
        'user',
        'table',
        'table.area',
        'payments',
        'deliveryInfo',
        'preparationScreenStatuses',
        'preparationScreenStatuses.preparationScreen',
        'ticketImpressions',
      ],
      order: {
        finalizedAt: 'DESC', // Más recientes primero
      },
    });

    return orders.map((order) => this.mapToReceiptListDto(order));
  }

  async finalizeMultipleOrders(
    finalizeOrdersDto: FinalizeOrdersDto,
    userId: string,
  ): Promise<void> {
    const { orderIds, paymentMethod, notes } = finalizeOrdersDto;

    for (const orderId of orderIds) {
      const order = await this.findOne(orderId);

      // Verificar que la orden esté en un estado finalizable
      if (
        order.orderStatus !== OrderStatus.READY &&
        order.orderStatus !== OrderStatus.DELIVERED
      ) {
        continue; // Saltar órdenes que no están en estado finalizable
      }

      // Preparar nota de finalización
      const finalizationNote = `[Finalizada por usuario ${userId} el ${new Date().toLocaleString()}] Método de pago: ${paymentMethod}`;
      const currentNotes = order.notes || '';
      let finalNotes = finalizationNote;

      if (notes && notes.trim()) {
        finalNotes += ` - ${notes.trim()}`;
      }

      if (currentNotes) {
        finalNotes = `${currentNotes}\n${finalNotes}`;
      }

      // Actualizar el estado de la orden a COMPLETED
      const updateData: UpdateOrderDto = {
        orderStatus: OrderStatus.COMPLETED,
        notes: finalNotes,
      };

      await this.update(orderId, updateData);

      // Liberar la mesa si la orden tenía una asignada
      if (order.tableId) {
        // Verificar si es una mesa temporal
        const table = await this.tablesService.findOne(order.tableId);

        if (table.isTemporary) {
          // Eliminar mesa temporal
          await this.tablesService.remove(order.tableId);
        } else {
          // Liberar mesa normal
          await this.tablesService.update(order.tableId, { isAvailable: true });
        }
      }
    }
  }

  async changeOrderStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.IN_PROGRESS,
        OrderStatus.IN_PREPARATION,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.IN_PROGRESS]: [
        OrderStatus.IN_PREPARATION,
        OrderStatus.READY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [
        OrderStatus.IN_DELIVERY,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.IN_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [], // No se puede cambiar desde completado
      [OrderStatus.CANCELLED]: [], // No se puede cambiar desde cancelado
    };

    const allowedTransitions = validTransitions[order.orderStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${order.orderStatus} a ${newStatus}`,
      );
    }

    const updatedOrder = await this.update(id, { orderStatus: newStatus });

    if (
      order.tableId &&
      (newStatus === OrderStatus.COMPLETED ||
        newStatus === OrderStatus.CANCELLED)
    ) {
      // Verificar si es una mesa temporal
      const table = await this.tablesService.findOne(order.tableId);

      if (table.isTemporary) {
        // Eliminar mesa temporal
        await this.tablesService.remove(order.tableId);
      } else {
        // Liberar mesa normal
        await this.tablesService.update(order.tableId, { isAvailable: true });
      }
    }

    return updatedOrder;
  }

  async hasItemsWithStatus(orderId: string, status: string): Promise<boolean> {
    const items = await this.orderItemRepository.findByOrderId(orderId);
    return items.some((item) => item.preparationStatus === status);
  }

  async changeOrderItemsStatus(
    orderId: string,
    userId: string,
    fromStatus: string,
    toStatus: string,
  ): Promise<void> {
    // Esta implementación delega al servicio de kitchen que ya tiene la lógica correcta
    // pero necesitamos inyectarlo primero. Por ahora usaremos TypeORM directamente.

    // Verificar que la orden existe
    const order = await this.findOne(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Por ahora simplemente actualizamos todos los items de la orden que coincidan con el estado
    // Sin considerar la pantalla del usuario (esto se debe mejorar en el futuro)
    const items = await this.orderItemRepository.findByOrderId(orderId);

    for (const item of items) {
      if (item.preparationStatus === fromStatus) {
        const updatedItem = {
          ...item,
          preparationStatus: toStatus as PreparationStatus,
          statusChangedAt: new Date(),
          ...(toStatus === 'READY' && {
            preparedAt: new Date(),
            preparedById: userId,
          }),
          ...(toStatus === 'PENDING' && {
            preparedAt: null,
            preparedById: null,
          }),
        };
        await this.orderItemRepository.save(updatedItem);
      }
    }

    // No actualizar el estado de la orden automáticamente
    // Esto ahora se controla desde los endpoints específicos
  }

  private async createInitialScreenStatuses(orderId: string): Promise<void> {
    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    const screenIds = new Set<string>();

    for (const item of orderItems) {
      if (item.product?.preparationScreenId) {
        screenIds.add(item.product.preparationScreenId);
      }
    }

    for (const screenId of screenIds) {
      await this.screenStatusRepository.create({
        orderId,
        preparationScreenId: screenId,
        status: PreparationScreenStatus.PENDING,
      } as OrderPreparationScreenStatus);
    }
  }

  private async handleNewItemsAddedToOrder(
    orderId: string,
    existingOrder: Order,
  ): Promise<void> {
    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    const itemsByScreen = new Map<string, OrderItem[]>();

    for (const item of orderItems) {
      if (item.product?.preparationScreenId) {
        const screenId = item.product.preparationScreenId;
        if (!itemsByScreen.has(screenId)) {
          itemsByScreen.set(screenId, []);
        }
        itemsByScreen.get(screenId)!.push(item);
      }
    }

    for (const [screenId, items] of itemsByScreen) {
      const existingStatus =
        await this.screenStatusRepository.findByOrderAndScreen(
          orderId,
          screenId,
        );

      if (existingStatus) {
        const hasPendingItems = items.some(
          (item) => item.preparationStatus === PreparationStatus.PENDING,
        );

        if (
          existingStatus.status === PreparationScreenStatus.READY &&
          hasPendingItems
        ) {
          await this.screenStatusRepository.update(existingStatus.id, {
            status: PreparationScreenStatus.IN_PREPARATION,
            completedAt: null,
            completedById: null,
          });

          if (existingOrder.orderStatus === OrderStatus.READY) {
            await this.orderRepository.update(orderId, {
              orderStatus: OrderStatus.IN_PREPARATION,
            });
          }
        }
      } else {
        await this.screenStatusRepository.create({
          orderId,
          preparationScreenId: screenId,
          status: PreparationScreenStatus.PENDING,
        } as OrderPreparationScreenStatus);
      }
    }
  }

  /**
   * Método centralizado para sincronizar los estados de pantallas de preparación
   * basándose en los orderItems actuales de la orden
   */
  private async syncPreparationScreenStatuses(
    orderId: string,
    existingOrder?: Order,
  ): Promise<void> {
    // Obtener todos los items actuales de la orden
    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    // Agrupar items por pantalla de preparación
    const itemsByScreen = new Map<string, OrderItem[]>();

    for (const item of orderItems) {
      if (item.product?.preparationScreenId) {
        const screenId = item.product.preparationScreenId;
        if (!itemsByScreen.has(screenId)) {
          itemsByScreen.set(screenId, []);
        }
        itemsByScreen.get(screenId)!.push(item);
      }
    }

    // Obtener todos los estados existentes para esta orden
    const existingStatuses =
      await this.screenStatusRepository.findByOrderId(orderId);
    const existingStatusesMap = new Map(
      existingStatuses.map((status) => [status.preparationScreenId, status]),
    );

    // Procesar cada pantalla de preparación requerida
    for (const [screenId, items] of itemsByScreen) {
      const existingStatus = existingStatusesMap.get(screenId);

      if (existingStatus) {
        // Verificar si hay items pendientes en esta pantalla
        const hasPendingItems = items.some(
          (item) => item.preparationStatus === PreparationStatus.PENDING,
        );

        // Si la pantalla estaba READY pero ahora tiene items pendientes,
        // cambiar a IN_PREPARATION
        if (
          existingStatus.status === PreparationScreenStatus.READY &&
          hasPendingItems
        ) {
          await this.screenStatusRepository.update(existingStatus.id, {
            status: PreparationScreenStatus.IN_PREPARATION,
            completedAt: null,
            completedById: null,
          });

          // Si la orden estaba READY, cambiarla a IN_PREPARATION
          if (existingOrder?.orderStatus === OrderStatus.READY) {
            await this.orderRepository.update(orderId, {
              orderStatus: OrderStatus.IN_PREPARATION,
            });
          }
        }
      } else {
        // Crear nuevo estado para pantalla que no existía antes
        await this.screenStatusRepository.create({
          orderId,
          preparationScreenId: screenId,
          status: PreparationScreenStatus.PENDING,
        } as OrderPreparationScreenStatus);
      }
    }

    // Eliminar estados de pantallas que ya no tienen items asociados
    const requiredScreenIds = new Set(itemsByScreen.keys());
    for (const existingStatus of existingStatuses) {
      if (!requiredScreenIds.has(existingStatus.preparationScreenId)) {
        await this.screenStatusRepository.remove(existingStatus.id);
      }
    }
  }

  private async handleDeliveryInfo(
    orderId: string,
    deliveryData: Partial<DeliveryInfo>,
    orderType: OrderType,
  ): Promise<DeliveryInfo | null> {
    if (orderType === OrderType.DINE_IN) {
      return null;
    }

    const cleanedData = this.cleanDeliveryInfoByOrderType(
      deliveryData,
      orderType,
    );

    const hasValidFields = Object.entries(cleanedData).some(
      ([, value]) => value !== undefined,
    );

    if (!hasValidFields) {
      return null;
    }

    const DeliveryInfoEntity = await import(
      './infrastructure/persistence/relational/entities/delivery-info.entity'
    );
    const DeliveryInfoRepo = this.dataSource.getRepository(
      DeliveryInfoEntity.DeliveryInfoEntity,
    );

    const existingDeliveryInfo = await DeliveryInfoRepo.findOne({
      where: { orderId },
    });

    if (existingDeliveryInfo) {
      return {
        ...existingDeliveryInfo,
        ...cleanedData,
        updatedAt: new Date(),
      } as DeliveryInfo;
    } else {
      const newId = uuidv4();
      return {
        id: newId,
        orderId,
        ...cleanedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DeliveryInfo;
    }
  }

  /**
   * Método helper para manejar actualizaciones de deliveryInfo
   */
  private async _updateDeliveryInfo(
    manager: any,
    orderId: string,
    updateOrderDto: UpdateOrderDto,
    finalOrderType: OrderType,
    existingOrder: Order,
  ): Promise<void> {
    if (finalOrderType === OrderType.DINE_IN) {
      // Si es DINE_IN, eliminar delivery_info
      await manager.delete('delivery_info', { orderId });
      return;
    }

    // Para otros tipos de orden, procesar los datos de entrega
    const deliveryData = {
      ...(existingOrder as any).deliveryInfo,
      ...updateOrderDto.deliveryInfo,
    };

    const deliveryInfo = await this.handleDeliveryInfo(
      orderId,
      deliveryData,
      finalOrderType,
    );

    if (deliveryInfo) {
      // Usar el repositorio que maneja correctamente las relaciones
      await this.orderRepository.update(orderId, { deliveryInfo });
    }
  }

  async quickFinalizeMultipleOrders(
    orderIds: string[],
    userId: string,
  ): Promise<{ ordersWithWarnings: string[] }> {
    const ordersWithWarnings: string[] = [];

    for (const orderId of orderIds) {
      try {
        const order = await this.findOne(orderId);

        // Si la orden no está en estado READY, la agregamos a las advertencias
        if (order.orderStatus !== OrderStatus.READY) {
          ordersWithWarnings.push(orderId);
        }

        await this.quickFinalizeOrder(orderId, userId);
      } catch (error) {
        // Si hay un error con una orden específica, continuamos con las demás
        this.logger.error(
          `Error finalizando orden ${orderId}: ${error.message}`,
        );
      }
    }

    return { ordersWithWarnings };
  }

  async quickFinalizeOrder(orderId: string, _userId: string): Promise<void> {
    // Ejecutar toda la operación en una transacción
    await this.dataSource.transaction(async (manager) => {
      // Obtener la orden con toda la información necesaria dentro de la transacción
      const order = await manager.findOne(OrderEntity, {
        where: { id: orderId },
        relations: [
          'table',
          'payments',
          'deliveryInfo',
        ],
      });

      // Verificar que la orden exista
      if (!order) {
        throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
      }

      // Verificar que la orden no esté ya completada o cancelada
      if (
        order.orderStatus === OrderStatus.COMPLETED ||
        order.orderStatus === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException('La orden ya está finalizada o cancelada');
      }

      // Calcular el monto pendiente de pago
      const totalPaid =
        order.payments?.reduce((sum, payment) => {
          return sum + Number(payment.amount);
        }, 0) || 0;

      const totalOrder =
        typeof order.total === 'string' ? parseFloat(order.total) : order.total;
      const pendingAmount = totalOrder - totalPaid;

      // Si hay monto pendiente, crear un pago en efectivo
      if (pendingAmount > 0) {
        await this.paymentsService.create({
          orderId: orderId,
          amount: pendingAmount,
          paymentMethod: PaymentMethod.CASH,
        });
      }

      // Cambiar el estado de la orden a COMPLETED directamente dentro de la transacción
      await manager.update(OrderEntity, orderId, { 
        orderStatus: OrderStatus.COMPLETED,
        finalizedAt: new Date()
      });

      // Si la orden tiene mesa asignada, liberarla
      if (order.tableId) {
        const table = await this.tablesService.findOne(order.tableId);

        if (table.isTemporary) {
          // Eliminar mesa temporal
          await this.tablesService.remove(order.tableId);
        } else {
          // Liberar mesa normal
          await this.tablesService.update(order.tableId, { isAvailable: true });
        }
      }
    });
  }

  async printOrderTicket(
    orderId: string,
    printerId: string,
    ticketType: 'GENERAL' | 'BILLING',
    userId: string,
  ): Promise<void> {
    // Verificar que la impresora existe y está activa
    const printerDetails = await this.thermalPrintersService.findOne(printerId);
    if (!printerDetails || !printerDetails.isActive) {
      throw new BadRequestException('Printer not found or inactive');
    }

    if (ticketType === 'BILLING') {
      // Para tickets de billing, usar el formato específico
      await this.printBillingTicketWithPrinter(orderId, printerDetails, userId);
    } else {
      // Para tickets generales, usar el mismo formato que los tickets automáticos
      // El último parámetro true indica que es una reimpresión manual
      await this.automaticPrintingService.printDeliveryPickupTicket(
        orderId,
        printerDetails,
        userId,
        true, // isReprint = true para indicar que es una impresión manual
      );
    }
  }

  private async printBillingTicketWithPrinter(
    orderId: string,
    printerDetails: ThermalPrinter,
    userId: string,
  ): Promise<void> {
    const order = await this.findOne(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const restaurantConfig = await this.restaurantConfigService.getConfig();

    // Importar las clases necesarias
    const {
      ThermalPrinter: ThermalPrinterLib,
      PrinterTypes,
    } = require('node-thermal-printer');

    const printer = new ThermalPrinterLib({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerDetails.ipAddress}:${printerDetails.port}`,
      removeSpecialCharacters: false,
      lineCharacter: '=',
    });

    try {
      const isConnected = await printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error(
          `No se pudo conectar a la impresora ${printerDetails.name}`,
        );
      }

      await this.printBillingTicket(printer, order, restaurantConfig);

      // Añadir líneas de avance según configuración
      for (let i = 0; i < printerDetails.feedLines; i++) {
        printer.newLine();
      }

      // Cortar papel si está habilitado
      if (printerDetails.cutPaper) {
        printer.cut();
      }

      await printer.execute();
      printer.clear();
    } catch (error) {
      printer.clear();
      throw error;
    }

    // Registrar la impresión con el printerId
    await this.registerTicketImpression(
      orderId,
      userId,
      TicketType.BILLING,
      printerDetails.id,
    );
  }

  private async printBillingTicket(
    printer: any,
    order: Order,
    restaurantConfig: any,
  ): Promise<void> {
    // Importar TicketFormatter
    const {
      TicketFormatter,
    } = require('../thermal-printers/utils/ticket-formatter');
    const formatter = new TicketFormatter(80); // Asumiendo papel de 80mm para billing

    // Encabezado del ticket - Primero el restaurante
    printer.alignCenter();

    // Nombre del restaurante con tamaño más grande
    printer.setTextSize(1, 1);
    printer.bold(true);
    printer.println(restaurantConfig.restaurantName || 'Restaurant');
    printer.bold(false);
    printer.setTextNormal();

    // Dirección del restaurante
    if (restaurantConfig.address) {
      printer.println(restaurantConfig.address);
      if (
        restaurantConfig.city ||
        restaurantConfig.state ||
        restaurantConfig.postalCode
      ) {
        const cityStateParts = [
          restaurantConfig.city,
          restaurantConfig.state,
          restaurantConfig.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        printer.println(cityStateParts);
      }
    }

    // Teléfonos
    if (restaurantConfig.phoneMain || restaurantConfig.phoneSecondary) {
      const phones: string[] = [];
      if (restaurantConfig.phoneMain)
        phones.push(`Tel: ${restaurantConfig.phoneMain}`);
      if (restaurantConfig.phoneSecondary)
        phones.push(`Tel 2: ${restaurantConfig.phoneSecondary}`);
      printer.println(phones.join(' - '));
    }

    printer.drawLine();

    // Configuración de texto más grande para número de orden y mesa
    printer.setTextSize(2, 2);
    printer.bold(true);

    // Número de orden con información de mesa/área
    if (order.table) {
      // Si hay área, mostrar área y mesa junto al número de orden
      if (order.table.area) {
        printer.println(
          `#${order.shiftOrderNumber} - ${order.table.area.name}`,
        );
        printer.println(`Mesa: ${order.table.name}`);
      } else {
        // Si no hay área, mostrar número de orden y mesa
        printer.println(`#${order.shiftOrderNumber}`);
        printer.println(`Mesa: ${order.table.name}`);
      }
    } else {
      // Si no hay mesa, solo mostrar número de orden y tipo
      printer.println(
        `#${order.shiftOrderNumber} - ${this.getOrderTypeLabel(order.orderType)}`,
      );
    }

    printer.bold(false);
    printer.setTextNormal();

    printer.drawLine();

    // Información de la orden
    printer.alignLeft();
    printer.println(
      `Fecha: ${new Date(order.createdAt).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
      })}`,
    );

    if (order.user?.firstName || order.user?.lastName) {
      const userName = [order.user.firstName, order.user.lastName]
        .filter(Boolean)
        .join(' ');
      printer.println(`Atendido por: ${userName}`);
    }

    // Información de cliente para delivery/takeaway
    if (order.deliveryInfo && order.deliveryInfo.recipientName) {
      printer.println(`Cliente: ${order.deliveryInfo.recipientName}`);
      if (order.deliveryInfo.recipientPhone) {
        printer.println(`Tel: ${order.deliveryInfo.recipientPhone}`);
      }
    }

    // Items de la orden
    printer.drawLine();
    printer.bold(true);
    printer.println('DETALLE DE CONSUMO');
    printer.bold(false);

    // Agrupar items idénticos usando el mismo método que el ticket general
    const groupedItems = this.groupIdenticalItemsForBilling(
      order.orderItems || [],
    );

    // Calcular el ancho máximo necesario para los precios
    let maxPriceWidth = 0;
    for (const item of groupedItems) {
      const priceStr = this.formatMoney(item.totalPrice);
      maxPriceWidth = Math.max(maxPriceWidth, priceStr.length);
    }
    const dynamicPriceColumnWidth = maxPriceWidth + 2;

    // Usar fuente normal para los productos (más conservador que el general)
    for (const item of groupedItems) {
      // Título del producto
      const productTitle = `${item.quantity}x ${item.variantName || item.productName}`;

      // Imprimir producto principal
      const productLines = formatter.formatProductTable(
        productTitle,
        this.formatMoney(item.totalPrice),
        'normal', // Fuente normal en lugar de expanded
        dynamicPriceColumnWidth,
      );

      for (const line of productLines) {
        printer.println(line);
      }

      // Personalizaciones de pizza (si las hay)
      if (item.pizzaCustomizations) {
        printer.println(`  ${item.pizzaCustomizations}`);
      }

      // Modificadores
      if (item.modifiers && item.modifiers.length > 0) {
        for (const modifier of item.modifiers) {
          let modifierText: string;
          if (modifier.price > 0) {
            if (item.quantity > 1) {
              modifierText = `• ${modifier.name} (+${this.formatMoney(modifier.price)} c/u)`;
            } else {
              modifierText = `• ${modifier.name} (+${this.formatMoney(modifier.price)})`;
            }
          } else {
            modifierText = `• ${modifier.name}`;
          }
          printer.println(`  ${modifierText}`);
        }
      }

      // Notas de preparación
      if (item.preparationNotes) {
        const wrappedNotes = formatter.wrapText(
          `  Notas: ${item.preparationNotes}`,
          'normal',
        );
        for (const line of wrappedNotes) {
          printer.println(line);
        }
      }
    }

    // Totales
    printer.drawLine();

    // Calcular totales
    const subtotal = Number(order.subtotal || order.total);
    const total = Number(order.total);
    const subtotalStr = this.formatMoney(subtotal);
    const totalStr = this.formatMoney(total);
    const maxTotalWidth = Math.max(subtotalStr.length, totalStr.length) + 2;

    // Subtotal
    const subtotalLines = formatter.formatProductTable(
      'Subtotal:',
      subtotalStr,
      'normal',
      maxTotalWidth,
    );
    for (const line of subtotalLines) {
      printer.println(line);
    }

    // Total con fuente ligeramente más grande
    const totalLines = formatter.formatProductTable(
      'TOTAL:',
      totalStr,
      'normal',
      maxTotalWidth,
    );
    printer.setTextSize(1, 1);
    printer.bold(true);
    for (const line of totalLines) {
      printer.println(line);
    }
    printer.setTextNormal();
    printer.bold(false);

    // Sección de pagos
    if (order.payments && order.payments.length > 0) {
      printer.drawLine();
      printer.bold(true);
      printer.println('DETALLE DE PAGOS');
      printer.bold(false);

      let totalPaid = 0;
      order.payments.forEach((payment) => {
        const amount = payment.amount;
        totalPaid += amount;
        const paymentLines = formatter.formatProductTable(
          this.getPaymentMethodLabel(payment.paymentMethod),
          this.formatMoney(amount),
          'normal',
          maxTotalWidth,
        );
        for (const line of paymentLines) {
          printer.println(line);
        }
      });

      const remaining = total - totalPaid;
      if (remaining > 0.01) {
        // Usar 0.01 para evitar problemas de precisión de punto flotante
        printer.println('');
        const remainingLines = formatter.formatProductTable(
          'POR PAGAR:',
          this.formatMoney(remaining),
          'normal',
          maxTotalWidth,
        );
        printer.bold(true);
        for (const line of remainingLines) {
          printer.println(line);
        }
        printer.bold(false);
      }
    }

    // Notas adicionales
    if (order.notes) {
      printer.drawLine();
      printer.bold(true);
      printer.println('NOTAS:');
      printer.bold(false);
      const wrappedNotes = formatter.wrapText(order.notes, 'normal');
      for (const line of wrappedNotes) {
        printer.println(line);
      }
    }

    // Pie del ticket
    printer.drawLine();
    printer.alignCenter();
    printer.println('¡Gracias por su preferencia!');
    printer.println('');

    // RFC y datos fiscales si están configurados
    if (restaurantConfig.rfc) {
      printer.println(`RFC: ${restaurantConfig.rfc}`);
    }

    printer.println('');
  }

  private getItemDescription(item: OrderItem): string {
    if (!item.product) return 'Producto desconocido';
    let description = item.product.name;

    if (item.productVariant) {
      description += ' - ' + item.productVariant.name;
    }

    if (item.productModifiers && item.productModifiers.length > 0) {
      const modifiers = item.productModifiers.map((m) => m.name).join(', ');
      description += ' (' + modifiers + ')';
    }

    return description;
  }

  private formatMoney(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  private groupIdenticalItemsForBilling(items: any[]): any[] {
    const groupedMap = new Map<string, any>();

    items.forEach((item) => {
      // Crear una clave única basada en todas las propiedades que deben ser idénticas
      const modifierIds = (item.productModifiers || [])
        .map((mod) => mod.id)
        .sort()
        .join(',');

      // Incluir personalizaciones de pizza en la clave
      const pizzaCustomizationIds = (item.selectedPizzaCustomizations || [])
        .map((pc) => `${pc.pizzaCustomizationId}-${pc.half}-${pc.action}`)
        .sort()
        .join(',');

      const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}`;

      const existingItem = groupedMap.get(groupKey);

      if (existingItem) {
        // Si ya existe un item idéntico, incrementar la cantidad
        existingItem.quantity += 1;
        existingItem.totalPrice += Number(item.finalPrice);
      } else {
        // Si es nuevo, agregarlo al mapa
        const groupedItem = {
          productId: item.productId,
          productName: item.product?.name || 'Producto',
          variantId: item.productVariantId || undefined,
          variantName: item.productVariant?.name || undefined,
          quantity: 1,
          unitPrice: Number(item.basePrice),
          totalPrice: Number(item.finalPrice),
          modifiers: (item.productModifiers || []).map((mod) => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price) || 0,
          })),
          preparationNotes: item.preparationNotes || undefined,
          pizzaCustomizations: this.formatPizzaCustomizationsForBilling(
            item.selectedPizzaCustomizations,
          ),
        };
        groupedMap.set(groupKey, groupedItem);
      }
    });

    return Array.from(groupedMap.values());
  }

  private formatPizzaCustomizationsForBilling(
    customizations: any[],
  ): string | undefined {
    if (!customizations || customizations.length === 0) return undefined;

    // Simplificar el formato para billing
    const parts: string[] = [];

    customizations.forEach((cust) => {
      if (cust.pizzaCustomization?.name) {
        parts.push(cust.pizzaCustomization.name);
      }
    });

    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  private getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'CREDIT_CARD':
        return 'T. Crédito';
      case 'DEBIT_CARD':
        return 'T. Débito';
      case 'TRANSFER':
        return 'Transferencia';
      default:
        return method;
    }
  }

  private getOrderTypeLabel(orderType: OrderType): string {
    switch (orderType) {
      case OrderType.DELIVERY:
        return 'DOMICILIO';
      case OrderType.TAKE_AWAY:
        return 'PARA LLEVAR';
      case OrderType.DINE_IN:
        return 'MESA';
      default:
        return orderType;
    }
  }

  /**
   * Obtiene el resumen de ventas de un turno
   */
  async getShiftSalesSummary(shiftId: string): Promise<any> {
    // Obtener información del turno
    const shift = await this.shiftsService.getShiftSummary(shiftId);
    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    // Obtener todas las órdenes del turno (optimizado para resumen)
    const orders = await this.orderRepository.findByShiftIdForSummary(shiftId);

    // Filtrar solo órdenes completadas/cobradas
    const completedOrders = orders.filter(
      (order) =>
        order.orderStatus === OrderStatus.COMPLETED ||
        order.orderStatus === OrderStatus.DELIVERED,
    );

    // Estructura para acumular datos
    const categoriesMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        quantity: number;
        totalAmount: number;
        subcategories: Map<
          string,
          {
            subcategoryId: string;
            subcategoryName: string;
            quantity: number;
            totalAmount: number;
            products: Map<
              string,
              {
                productId: string;
                productName: string;
                quantity: number;
                totalAmount: number;
              }
            >;
          }
        >;
      }
    >();

    let totalQuantity = 0;
    let totalSales = 0;
    const productSalesMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        quantity: number;
        totalAmount: number;
      }
    >();

    // Procesar cada orden
    for (const order of completedOrders) {
      if (!order.orderItems) continue;

      for (const item of order.orderItems) {
        const product = item.product;
        if (!product || !product.subcategory) continue;

        const subcategory = product.subcategory;
        const category = subcategory.category;
        if (!category) continue;

        const quantity = 1;
        const itemPrice = Number(item.finalPrice) || 0;
        const amount = itemPrice;

        if (itemPrice === 0) continue;

        totalQuantity += quantity;
        totalSales += amount;

        // Actualizar categoría
        if (!categoriesMap.has(category.id)) {
          categoriesMap.set(category.id, {
            categoryId: category.id,
            categoryName: category.name,
            quantity: 0,
            totalAmount: 0,
            subcategories: new Map(),
          });
        }
        const categoryData = categoriesMap.get(category.id)!;
        categoryData.quantity += quantity;
        categoryData.totalAmount += amount;

        // Actualizar subcategoría
        if (!categoryData.subcategories.has(subcategory.id)) {
          categoryData.subcategories.set(subcategory.id, {
            subcategoryId: subcategory.id,
            subcategoryName: subcategory.name,
            quantity: 0,
            totalAmount: 0,
            products: new Map(),
          });
        }
        const subcategoryData = categoryData.subcategories.get(subcategory.id)!;
        subcategoryData.quantity += quantity;
        subcategoryData.totalAmount += amount;

        // Actualizar producto
        const productKey = item.productVariant
          ? `${product.id}-${item.productVariant.id}`
          : product.id;
        const productName = item.productVariant
          ? `${product.name} - ${item.productVariant.name}`
          : product.name;

        if (!subcategoryData.products.has(productKey)) {
          subcategoryData.products.set(productKey, {
            productId: productKey,
            productName: productName,
            quantity: 0,
            totalAmount: 0,
          });
        }
        const productData = subcategoryData.products.get(productKey)!;
        productData.quantity += quantity;
        productData.totalAmount += amount;

        // Actualizar mapa de productos totales
        if (!productSalesMap.has(productKey)) {
          productSalesMap.set(productKey, {
            productId: productKey,
            productName: productName,
            quantity: 0,
            totalAmount: 0,
          });
        }
        const totalProductData = productSalesMap.get(productKey)!;
        totalProductData.quantity += quantity;
        totalProductData.totalAmount += amount;
      }
    }

    // Convertir mapas a arrays y calcular porcentajes
    const categories = Array.from(categoriesMap.values())
      .map((cat) => ({
        ...cat,
        percentage: totalSales > 0 ? (cat.totalAmount / totalSales) * 100 : 0,
        subcategories: Array.from(cat.subcategories.values())
          .map((sub) => ({
            ...sub,
            products: Array.from(sub.products.values())
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .map((prod) => ({
                ...prod,
                averagePrice:
                  prod.quantity > 0 ? prod.totalAmount / prod.quantity : 0,
              })),
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Top 10 productos más vendidos
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((prod) => ({
        ...prod,
        averagePrice: prod.quantity > 0 ? prod.totalAmount / prod.quantity : 0,
      }));

    return {
      shiftId: shift.id,
      shiftNumber: shift.shiftNumber,
      date: shift.date,
      totalSales,
      totalQuantity,
      completedOrders: completedOrders.length,
      averageTicket:
        completedOrders.length > 0 ? totalSales / completedOrders.length : 0,
      categories,
      topProducts,
      startTime: shift.openedAt,
      endTime: shift.closedAt,
    };
  }
}
