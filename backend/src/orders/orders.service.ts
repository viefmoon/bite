import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
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
} from '../common/tokens';
import { FinalizeOrdersDto } from './dto/finalize-orders.dto';
import { CustomersService } from '../customers/customers.service';
import { DeliveryInfo } from './domain/delivery-info';
import { RestaurantConfigService } from '../restaurant-config/restaurant-config.service';
import { OrderType } from './domain/enums/order-type.enum';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly orderItemRepository: OrderItemRepository,
    @Inject(TICKET_IMPRESSION_REPOSITORY)
    private readonly ticketImpressionRepository: TicketImpressionRepository,
    private readonly customersService: CustomersService,
    private readonly restaurantConfigService: RestaurantConfigService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
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

    // Crear la información de entrega (siempre requerida)
    const deliveryInfo: DeliveryInfo = {
      id: uuidv4(),
      orderId: '', // Se asignará después de crear la orden
      ...createOrderDto.deliveryInfo,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const order = await this.orderRepository.create({
      userId: createOrderDto.userId || null,
      tableId: createOrderDto.tableId || null,
      scheduledAt: createOrderDto.scheduledAt || null,
      orderType: createOrderDto.orderType,
      orderStatus: OrderStatus.PENDING,
      subtotal: createOrderDto.subtotal,
      total: createOrderDto.total,
      notes: createOrderDto.notes,
      customerId: createOrderDto.customerId || null,
      isFromWhatsApp: createOrderDto.isFromWhatsApp || false,
      deliveryInfo: deliveryInfo,
      estimatedDeliveryTime: estimatedDeliveryTime,
    });

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
        };
        // Guardar el item
        await this.createOrderItemInternal(createOrderItemDto); // Usar método interno
      }
    }
    // Recargar la orden completa al final para incluir todos los items y modificadores
    return this.findOne(order.id);
  }

  // Método interno para crear OrderItem sin la lógica de modificadores (evita recursión)
  private async createOrderItemInternal(
    createOrderItemDto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    await this.findOne(createOrderItemDto.orderId); // Verificar orden

    const orderItem = new OrderItem();
    orderItem.id = uuidv4();
    orderItem.orderId = createOrderItemDto.orderId;
    orderItem.productId = createOrderItemDto.productId;
    orderItem.productVariantId = createOrderItemDto.productVariantId || null;
    orderItem.basePrice = createOrderItemDto.basePrice;
    orderItem.finalPrice = createOrderItemDto.finalPrice;
    orderItem.preparationStatus = PreparationStatus.PENDING;
    orderItem.statusChangedAt = new Date();
    orderItem.preparationNotes = createOrderItemDto.preparationNotes || null;
    orderItem.productModifiers = createOrderItemDto.productModifiers
      ? createOrderItemDto.productModifiers.map(
          (modifier) => ({ id: modifier.modifierId }) as any,
        )
      : [];
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
    await this.findOne(id); // Verificar que la orden existe

    // Actualizar datos básicos de la orden
    const updatePayload: Partial<Order> = {};

    // Solo incluir campos que realmente se están actualizando
    if (updateOrderDto.userId !== undefined)
      updatePayload.userId = updateOrderDto.userId;
    if (updateOrderDto.tableId !== undefined)
      updatePayload.tableId = updateOrderDto.tableId;
    if (updateOrderDto.scheduledAt !== undefined)
      updatePayload.scheduledAt = updateOrderDto.scheduledAt;
    if (updateOrderDto.orderStatus !== undefined)
      updatePayload.orderStatus = updateOrderDto.orderStatus;
    if (updateOrderDto.orderType !== undefined)
      updatePayload.orderType = updateOrderDto.orderType;
    if (updateOrderDto.subtotal !== undefined)
      updatePayload.subtotal = updateOrderDto.subtotal;
    if (updateOrderDto.total !== undefined)
      updatePayload.total = updateOrderDto.total;
    if (updateOrderDto.notes !== undefined)
      updatePayload.notes = updateOrderDto.notes;

    // Manejar actualización de deliveryInfo (siempre crear un nuevo objeto)
    if (updateOrderDto.deliveryInfo !== undefined) {
      updatePayload.deliveryInfo = {
        id: uuidv4(),
        orderId: id,
        ...updateOrderDto.deliveryInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Solo actualizar si hay cambios en los campos básicos
    if (Object.keys(updatePayload).length > 0) {
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

      // Eliminar TODOS los items existentes
      for (const item of existingItems) {
        await this.orderItemRepository.delete(item.id);
      }

      // Crear TODOS los items nuevos
      for (const itemDto of updateOrderDto.items) {
        const createOrderItemDto: CreateOrderItemDto = {
          orderId: id,
          productId: itemDto.productId,
          productVariantId: itemDto.productVariantId,
          basePrice: itemDto.basePrice,
          finalPrice: itemDto.finalPrice,
          preparationNotes: itemDto.preparationNotes,
          productModifiers: itemDto.productModifiers,
        };

        await this.createOrderItemInternal(createOrderItemDto);
      }
    }

    // Recargar la orden completa con todos los datos actualizados
    return this.findOne(id);
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

  async findByDailyOrderCounterId(
    dailyOrderCounterId: string,
  ): Promise<Order[]> {
    return this.orderRepository.findByDailyOrderCounterId(dailyOrderCounterId);
  }

  async findOpenOrders(): Promise<Order[]> {
    const today = new Date();
    return this.orderRepository.findOpenOrdersByDate(today);
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

  async updateOrderItem(
    id: string,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const existingOrderItem = await this.findOrderItemById(id);

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
    updatedOrderItem.orderId = updatedData.orderId;
    updatedOrderItem.productId = updatedData.productId;
    updatedOrderItem.productVariantId = updatedData.productVariantId;
    updatedOrderItem.basePrice = updatedData.basePrice;
    updatedOrderItem.finalPrice = updatedData.finalPrice;
    updatedOrderItem.preparationStatus = updatedData.preparationStatus;
    updatedOrderItem.statusChangedAt = updatedData.statusChangedAt;
    updatedOrderItem.preparationNotes = updatedData.preparationNotes;
    // Asignar relaciones y timestamps existentes si es necesario para el repositorio
    updatedOrderItem.order = existingOrderItem.order;
    updatedOrderItem.product = existingOrderItem.product;
    updatedOrderItem.productVariant = existingOrderItem.productVariant;
    updatedOrderItem.productModifiers = updateOrderItemDto.productModifiers
      ? updateOrderItemDto.productModifiers.map(
          (modifier) => ({ id: modifier.modifierId }) as any,
        )
      : existingOrderItem.productModifiers;
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

  async findOrdersForFinalization(): Promise<Order[]> {
    return this.orderRepository.findOrdersForFinalization();
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
    }
  }
}
