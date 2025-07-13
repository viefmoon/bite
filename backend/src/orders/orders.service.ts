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
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { OrderStatus } from './domain/enums/order-status.enum';
import { OrderItemRepository } from './infrastructure/persistence/order-item.repository';
import { OrderItem } from './domain/order-item';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { PreparationStatus } from './domain/order-item';
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
import { CustomersService } from '../customers/customers.service';
import { DeliveryInfo } from './domain/delivery-info';
import { RestaurantConfigService } from '../restaurant-config/restaurant-config.service';
import { OrderType } from './domain/enums/order-type.enum';
import { ProductRepository } from '../products/infrastructure/persistence/product.repository';
import { OrderChangeTrackerV2Service } from './services/order-change-tracker-v2.service';
import { DataSource } from 'typeorm';
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
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    private readonly tablesService: TablesService,
    private readonly shiftsService: ShiftsService,
    @Inject(forwardRef(() => AutomaticPrintingService))
    private readonly automaticPrintingService: AutomaticPrintingService,
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
        ([key, value]) => value !== undefined && value !== null && value !== '',
      );

    if (hasDeliveryData) {
      // Limpiar campos de deliveryInfo según el tipo de pedido
      const cleanedDeliveryInfo = this.cleanDeliveryInfoByOrderType(
        createOrderDto.deliveryInfo,
        createOrderDto.orderType,
      );

      // Solo crear deliveryInfo si quedan campos después de la limpieza
      const hasCleanedData = Object.entries(cleanedDeliveryInfo).some(
        ([key, value]) => value !== undefined && value !== null && value !== '',
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
          selectedPizzaCustomizations: itemDto.selectedPizzaCustomizations, // IMPORTANTE: Pasar las personalizaciones de pizza
        };
        // Guardar el item
        await this.createOrderItemInternal(createOrderItemDto); // Usar método interno
      }
    }

    // Crear estados de pantalla para cada pantalla que tenga items
    await this.createInitialScreenStatuses(order.id);

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
        console.error(
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

  async findAll(
    filterOptions: FindAllOrdersDto,
    paginationOptions: IPaginationOptions,
  ): Promise<[Order[], number]> {
    return this.orderRepository.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
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
    // Obtener la orden existente para comparar
    const existingOrder = await this.findOne(id);

    // Capturar el estado anterior completo de la entidad ANTES de cualquier cambio
    let previousOrderEntity: OrderEntity | null = null;
    if (
      existingOrder.orderType === OrderType.DELIVERY ||
      existingOrder.orderType === OrderType.TAKE_AWAY
    ) {
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        previousOrderEntity = await queryRunner.manager.findOne(OrderEntity, {
          where: { id },
          relations: [
            'orderItems',
            'orderItems.product',
            'orderItems.productVariant',
            'orderItems.productModifiers',
            'orderItems.selectedPizzaCustomizations',
            'orderItems.selectedPizzaCustomizations.pizzaCustomization',
            'deliveryInfo',
          ],
        });
      } finally {
        await queryRunner.release();
      }
    }

    // Actualizar datos básicos de la orden
    const updatePayload: Partial<Order> = {};

    // Solo incluir campos que realmente cambiaron
    if (
      updateOrderDto.userId !== undefined &&
      updateOrderDto.userId !== existingOrder.userId
    )
      updatePayload.userId = updateOrderDto.userId;
    if (
      updateOrderDto.tableId !== undefined &&
      updateOrderDto.tableId !== existingOrder.tableId
    ) {
      updatePayload.tableId = updateOrderDto.tableId;

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
        if (updateOrderDto.tableId) {
          // Verificar que la mesa esté disponible
          const newTable = await this.tablesService.findOne(
            updateOrderDto.tableId,
          );
          if (!newTable.isAvailable) {
            throw new BadRequestException(
              `La mesa ${newTable.name} no está disponible`,
            );
          }

          await this.tablesService.update(updateOrderDto.tableId, {
            isAvailable: false,
          });
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

      // Si la orden se está completando o cancelando, liberar la mesa
      if (
        existingOrder.tableId &&
        (updateOrderDto.orderStatus === OrderStatus.COMPLETED ||
          updateOrderDto.orderStatus === OrderStatus.CANCELLED)
      ) {
        // Verificar si es una mesa temporal
        const table = await this.tablesService.findOne(existingOrder.tableId);

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
    if (
      updateOrderDto.orderType !== undefined &&
      updateOrderDto.orderType !== existingOrder.orderType
    ) {
      updatePayload.orderType = updateOrderDto.orderType;

      this.logger.debug(`Cambio de tipo de orden: ${existingOrder.orderType} → ${updateOrderDto.orderType}`);

      // Si se cambia de DINE_IN a otro tipo, liberar la mesa
      if (
        existingOrder.orderType === OrderType.DINE_IN &&
        updateOrderDto.orderType !== OrderType.DINE_IN
      ) {
        this.logger.debug(`Liberando mesa para orden ${id}. TableId actual: ${existingOrder.tableId}`);
        
        // SIEMPRE limpiar tableId cuando se cambia de DINE_IN a otro tipo
        updatePayload.tableId = null;
        this.logger.debug(`TableId limpiado: ${updatePayload.tableId}`);
        
        // Solo intentar liberar la mesa si existe y la orden no está terminada
        if (
          existingOrder.tableId &&
          existingOrder.orderStatus !== OrderStatus.COMPLETED &&
          existingOrder.orderStatus !== OrderStatus.CANCELLED
        ) {
          try {
            // Verificar si es mesa temporal
            const table = await this.tablesService.findOne(existingOrder.tableId);

            if (table.isTemporary) {
              // Eliminar mesa temporal
              await this.tablesService.remove(existingOrder.tableId);
              this.logger.debug(`Mesa temporal ${existingOrder.tableId} eliminada`);
            } else {
              // Liberar mesa normal
              await this.tablesService.update(existingOrder.tableId, {
                isAvailable: true,
              });
              this.logger.debug(`Mesa normal ${existingOrder.tableId} liberada`);
            }
          } catch (error) {
            this.logger.error(`Error al liberar mesa ${existingOrder.tableId}:`, error);
            // Continuar con la actualización aunque haya error con la mesa
          }
        }
      }
      
      // Si se cambia de DELIVERY/TAKEAWAY a DINE_IN, asegurar que tableId se maneje correctamente
      if (
        (existingOrder.orderType === OrderType.DELIVERY || existingOrder.orderType === OrderType.TAKE_AWAY) &&
        updateOrderDto.orderType === OrderType.DINE_IN
      ) {
        this.logger.debug(`Cambio a DINE_IN, tableId en payload: ${updateOrderDto.tableId}`);
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
    const finalOrderType = updateOrderDto.orderType || existingOrder.orderType;

    // IMPORTANTE: Si no se envía deliveryInfo en el payload, aplicar limpieza según el tipo de orden
    // Esto es crítico para que funcione correctamente cuando el frontend no envía el campo
    const deliveryInfoInPayload = 'deliveryInfo' in updateOrderDto;
    const orderTypeChanged =
      updateOrderDto.orderType !== undefined &&
      updateOrderDto.orderType !== existingOrder.orderType;

    // SIEMPRE verificar y limpiar deliveryInfo según el tipo de orden
    // Esto es fundamental para que funcione correctamente

    // 1. Si el tipo de orden es DINE_IN, eliminar deliveryInfo completamente
    if (finalOrderType === OrderType.DINE_IN) {
      updatePayload.deliveryInfo = null;
    }
    // 2. Si se envió deliveryInfo en el payload, dar PRIORIDAD a los nuevos datos
    else if (deliveryInfoInPayload && updateOrderDto.deliveryInfo) {
      this.logger.debug(`PRIORIDAD: Procesando nuevos datos del payload`);
      this.logger.debug(`Datos originales deliveryInfo: ${JSON.stringify(updateOrderDto.deliveryInfo)}`);
      this.logger.debug(`Tipo de orden: ${finalOrderType}`);
      
      // Obtener datos existentes con más detalle
      const existingDeliveryInfo = (existingOrder as any).deliveryInfo;
      this.logger.debug(`Datos existentes completos: ${JSON.stringify(existingDeliveryInfo)}`);
      
      // Combinar datos existentes con nuevos datos del payload
      const existingData = existingDeliveryInfo || {};
      const combinedData = { ...existingData, ...updateOrderDto.deliveryInfo };
      
      this.logger.debug(`Datos combinados: ${JSON.stringify(combinedData)}`);
      
      const cleanedDeliveryInfo = this.cleanDeliveryInfoByOrderType(
        combinedData,
        finalOrderType,
      );

      this.logger.debug(`Datos limpiados deliveryInfo: ${JSON.stringify(cleanedDeliveryInfo)}`);

      const hasValidFields = Object.entries(cleanedDeliveryInfo).some(
        ([key, value]) => value !== undefined && value !== null && value !== '',
      );
      
      this.logger.debug(`Tiene campos válidos: ${hasValidFields}`);

      if (hasValidFields) {
        if (existingDeliveryInfo && existingDeliveryInfo.id) {
          // Actualizar la instancia existente - PRESERVAR ID EXISTENTE
          updatePayload.deliveryInfo = {
            ...existingDeliveryInfo,
            ...cleanedDeliveryInfo,
            id: existingDeliveryInfo.id, // CRÍTICO: preservar el ID existente
            orderId: existingDeliveryInfo.orderId, // CRÍTICO: preservar el orderId existente
            createdAt: existingDeliveryInfo.createdAt, // CRÍTICO: preservar createdAt existente
            updatedAt: new Date(),
          } as DeliveryInfo;
          this.logger.debug(`Actualizando delivery_info existente con ID: ${existingDeliveryInfo.id}`);
        } else {
          // Crear nueva instancia
          updatePayload.deliveryInfo = {
            id: uuidv4(),
            orderId: id,
            ...cleanedDeliveryInfo,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as DeliveryInfo;
          this.logger.debug(`Creando nueva delivery_info con ID: ${updatePayload.deliveryInfo.id}`);
        }
      }
    }
    // 3. Si NO se envió deliveryInfo pero existe, aplicar limpieza sobre datos existentes
    else if ((existingOrder as any).deliveryInfo) {
      this.logger.debug(`Datos existentes deliveryInfo: ${JSON.stringify((existingOrder as any).deliveryInfo)}`);
      this.logger.debug(`Tipo de orden final: ${finalOrderType}`);
      
      const cleanedDeliveryInfo = this.cleanDeliveryInfoByOrderType(
        (existingOrder as any).deliveryInfo,
        finalOrderType,
      );

      this.logger.debug(`Datos limpiados existentes: ${JSON.stringify(cleanedDeliveryInfo)}`);

      // Contar campos con valores reales
      const validFieldsCount = Object.entries(cleanedDeliveryInfo).filter(
        ([key, value]) => value !== undefined && value !== null && value !== '',
      ).length;
      
      this.logger.debug(`Campos válidos existentes: ${validFieldsCount}`);

      // Si no quedan campos válidos, eliminar completamente
      if (validFieldsCount === 0) {
        updatePayload.deliveryInfo = null;
      }
      // Si hay campos válidos, verificar si hubo cambios
      else {
        const hasChanges = this.hasDeliveryInfoChanges(
          (existingOrder as any).deliveryInfo,
          cleanedDeliveryInfo,
        );

        // FORZAR actualización si hay cambios o si cambió el tipo de orden
        if (hasChanges || orderTypeChanged) {
          const existingDeliveryInfo = (existingOrder as any).deliveryInfo;
          if (existingDeliveryInfo) {
            // Actualizar la instancia existente
            updatePayload.deliveryInfo = {
              ...existingDeliveryInfo,
              ...cleanedDeliveryInfo,
              updatedAt: new Date(),
            } as DeliveryInfo;
          } else {
            // Crear nueva instancia
            updatePayload.deliveryInfo = {
              id: uuidv4(),
              orderId: id,
              ...cleanedDeliveryInfo,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as DeliveryInfo;
          }
        }
      }
    }

    // Solo actualizar si hay cambios en los campos básicos
    if (Object.keys(updatePayload).length > 0) {
      this.logger.debug(`Payload completo para actualización: ${JSON.stringify(updatePayload, null, 2)}`);
      const updatedOrder = await this.orderRepository.update(id, updatePayload);
      if (!updatedOrder) {
        throw new Error(`Failed to update order with ID ${id}`);
      }
    }

    // Solo procesar items si se proporcionaron explícitamente
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
            const nonExistingCount = itemIds.length - existingGroupItems.length;

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
              selectedPizzaCustomizations: itemDto.selectedPizzaCustomizations,
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
              selectedPizzaCustomizations: itemDto.selectedPizzaCustomizations,
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
      for (const itemIdToDelete of itemsToDelete) {
        await this.orderItemRepository.delete(itemIdToDelete);
      }

      // Si se agregaron nuevos items, verificar y actualizar estados de pantalla
      if (hasNewItems) {
        await this.handleNewItemsAddedToOrder(id, existingOrder);
      }
    }

    // Recargar la orden completa con todos los datos actualizados
    const updatedOrder = await this.findOne(id);

    // Detectar cambios reales usando el servicio de tracking de cambios
    let hasRealChanges = false;

    if (
      (updatedOrder.orderType === OrderType.DELIVERY ||
        updatedOrder.orderType === OrderType.TAKE_AWAY) &&
      previousOrderEntity
    ) {
      const queryRunner = this.dataSource.createQueryRunner();

      try {
        await queryRunner.connect();

        // Obtener el estado actual (después de los cambios)
        const currentEntity = await queryRunner.manager.findOne(OrderEntity, {
          where: { id: updatedOrder.id },
          relations: [
            'orderItems',
            'orderItems.product',
            'orderItems.productVariant',
            'orderItems.productModifiers',
            'orderItems.selectedPizzaCustomizations',
            'orderItems.selectedPizzaCustomizations.pizzaCustomization',
            'deliveryInfo',
          ],
        });

        if (currentEntity) {
          // Usar el método privado del servicio para detectar cambios
          const changes = (
            this.orderChangeTracker as any
          ).detectChangesUsingSnapshots(currentEntity, previousOrderEntity);

          hasRealChanges = changes !== null;

          // Log para debugging
          if (changes) {
            this.logger.log(
              `Cambios detectados en orden ${id}: ${changes.summary || 'Sin resumen'}`,
            );
          } else {
            this.logger.log(
              `No se detectaron cambios reales en orden ${id}, no se reimprimirá el ticket`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Error al detectar cambios en orden ${id}:`, error);
        // En caso de error, asumir que hay cambios para no perder reimpresiones importantes
        hasRealChanges = true;
      } finally {
        await queryRunner.release();
      }
    }

    // Disparar reimpresión automática solo si hubo cambios reales
    if (hasRealChanges) {
      await this.automaticPrintingService.printOrderAutomatically(
        updatedOrder.id,
        updatedOrder.orderType,
        updateOrderDto.userId || null,
        true, // isReprint = true
      );
    }

    this.logger.debug(`Orden actualizada - TableId final: ${updatedOrder.tableId}, OrderType: ${updatedOrder.orderType}`);
    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Asegurarse de que la orden existe
    return this.orderRepository.remove(id);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async findByTableId(tableId: string): Promise<Order[]> {
    return this.orderRepository.findByTableId(tableId);
  }

  async findByShiftId(shiftId: string): Promise<Order[]> {
    return this.orderRepository.findByShiftId(shiftId);
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

  /**
   * Limpia los campos de deliveryInfo según el tipo de pedido
   * REGLAS DE LIMPIEZA:
   * - DINE_IN: No necesita deliveryInfo (se elimina completamente)
   * - TAKE_AWAY: Solo necesita recipientName, recipientPhone y deliveryInstructions
   * - DELIVERY: Solo necesita campos de dirección y recipientPhone
   */
  private cleanDeliveryInfoByOrderType(
    deliveryInfo: Partial<DeliveryInfo>,
    orderType: OrderType,
  ): Partial<DeliveryInfo> {
    // Inicializar el resultado con todos los campos posibles
    const result: Partial<DeliveryInfo> = {};

    if (orderType === OrderType.DINE_IN) {
      // Para pedidos DINE_IN, marcar todos los campos como undefined
      result.fullAddress = undefined;
      result.street = undefined;
      result.number = undefined;
      result.interiorNumber = undefined;
      result.neighborhood = undefined;
      result.city = undefined;
      result.state = undefined;
      result.zipCode = undefined;
      result.country = undefined;
      result.latitude = undefined;
      result.longitude = undefined;
      result.recipientName = undefined;
      result.recipientPhone = undefined;
      result.deliveryInstructions = undefined;
      
      return result;
    }

    if (orderType === OrderType.TAKE_AWAY) {
      // Para TAKE_AWAY solo conservamos:
      // - recipientName (nombre del cliente)
      // - recipientPhone (teléfono del cliente)
      // - deliveryInstructions (notas especiales)
      
      // Conservar campos válidos
              if (deliveryInfo.recipientName !== undefined && deliveryInfo.recipientName !== null && deliveryInfo.recipientName !== '') {
          result.recipientName = deliveryInfo.recipientName;
        } else {
          result.recipientName = undefined;
        }
        
        if (deliveryInfo.recipientPhone !== undefined && deliveryInfo.recipientPhone !== null && deliveryInfo.recipientPhone !== '') {
          result.recipientPhone = deliveryInfo.recipientPhone;
        } else {
          result.recipientPhone = undefined;
        }
        
        if (deliveryInfo.deliveryInstructions !== undefined && deliveryInfo.deliveryInstructions !== null && deliveryInfo.deliveryInstructions !== '') {
          result.deliveryInstructions = deliveryInfo.deliveryInstructions;
        } else {
          result.deliveryInstructions = undefined;
        }
        
        // Marcar campos de dirección como undefined
        result.fullAddress = undefined;
        result.street = undefined;
        result.number = undefined;
        result.interiorNumber = undefined;
        result.neighborhood = undefined;
        result.city = undefined;
        result.state = undefined;
        result.zipCode = undefined;
        result.country = undefined;
        result.latitude = undefined;
        result.longitude = undefined;
      
      return result;
    }

    if (orderType === OrderType.DELIVERY) {
      // Para DELIVERY solo conservamos:
      // - Campos de dirección completa
      // - recipientPhone (teléfono de contacto para entrega)
      // - deliveryInstructions (instrucciones de entrega)
      // NO conservamos recipientName
      
              // Conservar campos de dirección válidos
        if (deliveryInfo.fullAddress !== undefined && deliveryInfo.fullAddress !== null && deliveryInfo.fullAddress !== '') {
          result.fullAddress = deliveryInfo.fullAddress;
        } else {
          result.fullAddress = undefined;
        }
        
        if (deliveryInfo.street !== undefined && deliveryInfo.street !== null && deliveryInfo.street !== '') {
          result.street = deliveryInfo.street;
        } else {
          result.street = undefined;
        }
        
        if (deliveryInfo.number !== undefined && deliveryInfo.number !== null && deliveryInfo.number !== '') {
          result.number = deliveryInfo.number;
        } else {
          result.number = undefined;
        }
        
        if (deliveryInfo.interiorNumber !== undefined && deliveryInfo.interiorNumber !== null && deliveryInfo.interiorNumber !== '') {
          result.interiorNumber = deliveryInfo.interiorNumber;
        } else {
          result.interiorNumber = undefined;
        }
        
        if (deliveryInfo.neighborhood !== undefined && deliveryInfo.neighborhood !== null && deliveryInfo.neighborhood !== '') {
          result.neighborhood = deliveryInfo.neighborhood;
        } else {
          result.neighborhood = undefined;
        }
        
        if (deliveryInfo.city !== undefined && deliveryInfo.city !== null && deliveryInfo.city !== '') {
          result.city = deliveryInfo.city;
        } else {
          result.city = undefined;
        }
        
        if (deliveryInfo.state !== undefined && deliveryInfo.state !== null && deliveryInfo.state !== '') {
          result.state = deliveryInfo.state;
        } else {
          result.state = undefined;
        }
        
        if (deliveryInfo.zipCode !== undefined && deliveryInfo.zipCode !== null && deliveryInfo.zipCode !== '') {
          result.zipCode = deliveryInfo.zipCode;
        } else {
          result.zipCode = undefined;
        }
        
        if (deliveryInfo.country !== undefined && deliveryInfo.country !== null && deliveryInfo.country !== '') {
          result.country = deliveryInfo.country;
        } else {
          result.country = undefined;
        }
        
        if (deliveryInfo.latitude !== undefined && deliveryInfo.latitude !== null) {
          result.latitude = deliveryInfo.latitude;
        } else {
          result.latitude = undefined;
        }
        
        if (deliveryInfo.longitude !== undefined && deliveryInfo.longitude !== null) {
          result.longitude = deliveryInfo.longitude;
        } else {
          result.longitude = undefined;
        }
        
        if (deliveryInfo.deliveryInstructions !== undefined && deliveryInfo.deliveryInstructions !== null && deliveryInfo.deliveryInstructions !== '') {
          result.deliveryInstructions = deliveryInfo.deliveryInstructions;
        } else {
          result.deliveryInstructions = undefined;
        }
        
        if (deliveryInfo.recipientPhone !== undefined && deliveryInfo.recipientPhone !== null && deliveryInfo.recipientPhone !== '') {
          result.recipientPhone = deliveryInfo.recipientPhone;
        } else {
          result.recipientPhone = undefined;
        }
        
        // Marcar recipientName como undefined (no necesario para DELIVERY)
        result.recipientName = undefined;
      
      return result;
    }

    // Por defecto, marcar todos los campos como undefined
    result.fullAddress = undefined;
    result.street = undefined;
    result.number = undefined;
    result.interiorNumber = undefined;
    result.neighborhood = undefined;
    result.city = undefined;
    result.state = undefined;
    result.zipCode = undefined;
    result.country = undefined;
    result.latitude = undefined;
    result.longitude = undefined;
    result.recipientName = undefined;
    result.recipientPhone = undefined;
    result.deliveryInstructions = undefined;
    
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
  ): Promise<TicketImpression> {
    await this.findOne(orderId); // Verificar orden

    const impressionData = {
      orderId,
      userId,
      ticketType,
      impressionTime: new Date(),
    };
    return this.ticketImpressionRepository.create(impressionData);
  }

  async findImpressionsByOrderId(orderId: string): Promise<TicketImpression[]> {
    await this.findOne(orderId); // Verificar orden
    return this.ticketImpressionRepository.findByOrderId(orderId);
  }

  async recoverOrder(id: string): Promise<Order> {
    const order = await this.findOne(id);

    // Verificar que la orden esté en un estado recuperable
    if (
      order.orderStatus !== OrderStatus.COMPLETED &&
      order.orderStatus !== OrderStatus.CANCELLED
    ) {
      throw new NotFoundException(
        `La orden no está en un estado recuperable. Estado actual: ${order.orderStatus}`,
      );
    }

    // Actualizar el estado de la orden a DELIVERED sin modificar las notas
    const updateData: UpdateOrderDto = {
      orderStatus: OrderStatus.DELIVERED,
    };

    return this.update(id, updateData);
  }

  async findOrdersForFinalization(): Promise<OrderForFinalizationDto[]> {
    const orders = await this.orderRepository.findOrdersForFinalization();

    return orders.map((order) => this.mapOrderToFinalizationDto(order));
  }

  private mapOrderToFinalizationDto(order: Order): OrderForFinalizationDto {
    // Agrupar items idénticos
    const groupedItems = new Map<
      string,
      {
        items: OrderItem[];
        modifiers: any[];
      }
    >();

    // Recopilar pantallas de preparación únicas
    const preparationScreens = new Set<string>();

    // Agrupar por producto, variante, modificadores y notas de preparación
    order.orderItems.forEach((item) => {
      // Agregar pantalla de preparación si existe
      if (item.product?.preparationScreen?.name) {
        preparationScreens.add(item.product.preparationScreen.name);
      }

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

    // Convertir grupos a DTOs
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

    // Crear DTO de orden
    const orderDto: OrderForFinalizationDto = {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      total: order.total,
      orderItems: orderItemDtos,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
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
      preparationScreens: Array.from(preparationScreens).sort(),
      payments: order.payments || undefined,
      preparationScreenStatuses: order.preparationScreenStatuses?.map(
        (status) => ({
          id: status.id,
          preparationScreenId: status.preparationScreenId,
          preparationScreenName:
            status.preparationScreen?.name || 'Pantalla desconocida',
          status: status.status,
          startedAt: status.startedAt,
          completedAt: status.completedAt,
        }),
      ),
    };

    return orderDto;
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

    // Validar transiciones de estado permitidas
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

    // Actualizar el estado de la orden
    const updatedOrder = await this.update(id, { orderStatus: newStatus });

    // Liberar la mesa si la orden se completa o cancela
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
    // Obtener todos los items de la orden con sus productos
    const orderItems = await this.orderItemRepository.findByOrderId(orderId);

    // Agrupar items por pantalla de preparación
    const screenIds = new Set<string>();

    for (const item of orderItems) {
      if (item.product?.preparationScreenId) {
        screenIds.add(item.product.preparationScreenId);
      }
    }

    // Crear estado inicial para cada pantalla
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
    // Obtener todos los items de la orden con sus productos
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

    // Para cada pantalla que tenga items
    for (const [screenId, items] of itemsByScreen) {
      // Verificar si la pantalla ya tiene un estado
      const existingStatus =
        await this.screenStatusRepository.findByOrderAndScreen(
          orderId,
          screenId,
        );

      if (existingStatus) {
        // Si la pantalla estaba READY y se agregaron nuevos items (PENDING)
        const hasPendingItems = items.some(
          (item) => item.preparationStatus === PreparationStatus.PENDING,
        );

        if (
          existingStatus.status === PreparationScreenStatus.READY &&
          hasPendingItems
        ) {
          // Regresar la pantalla a IN_PREPARATION
          await this.screenStatusRepository.update(existingStatus.id, {
            status: PreparationScreenStatus.IN_PREPARATION,
            completedAt: null,
            completedById: null,
          });

          // Actualizar el estado de la orden si estaba READY
          if (existingOrder.orderStatus === OrderStatus.READY) {
            await this.orderRepository.update(orderId, {
              orderStatus: OrderStatus.IN_PREPARATION,
            });
          }
        }
      } else {
        // Si es una pantalla nueva, crear el estado inicial
        await this.screenStatusRepository.create({
          orderId,
          preparationScreenId: screenId,
          status: PreparationScreenStatus.PENDING,
        } as OrderPreparationScreenStatus);
      }
    }
  }
}
