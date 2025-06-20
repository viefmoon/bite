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
import { OrderItemModifierRepository } from './infrastructure/persistence/order-item-modifier.repository';
import { OrderItemModifier } from './domain/order-item-modifier';
import { OrderItemRepository } from './infrastructure/persistence/order-item.repository';
import { OrderItem } from './domain/order-item';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateOrderItemModifierDto } from './dto/update-order-item-modifier.dto';
import { PreparationStatus } from './domain/order-item';
import { v4 as uuidv4 } from 'uuid';
import { TicketImpressionRepository } from './infrastructure/persistence/ticket-impression.repository';
import { TicketType } from './domain/enums/ticket-type.enum';
import { TicketImpression } from './domain/ticket-impression';
import {
  ORDER_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_ITEM_MODIFIER_REPOSITORY,
  TICKET_IMPRESSION_REPOSITORY,
} from '../common/tokens';
import { FinalizeOrdersDto } from './dto/finalize-orders.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(ORDER_ITEM_MODIFIER_REPOSITORY)
    private readonly orderItemModifierRepository: OrderItemModifierRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly orderItemRepository: OrderItemRepository,
    @Inject(TICKET_IMPRESSION_REPOSITORY)
    private readonly ticketImpressionRepository: TicketImpressionRepository,
    private readonly customersService: CustomersService,
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

    const order = await this.orderRepository.create({
      userId: createOrderDto.userId || null,
      tableId: createOrderDto.tableId || null,
      scheduledAt: createOrderDto.scheduledAt || null,
      orderType: createOrderDto.orderType,
      orderStatus: OrderStatus.PENDING,
      subtotal: createOrderDto.subtotal,
      total: createOrderDto.total,
      notes: createOrderDto.notes,
      phoneNumber: createOrderDto.phoneNumber || null,
      customerName: createOrderDto.customerName || null,
      deliveryAddress: createOrderDto.deliveryAddress || null,
      customerId: createOrderDto.customerId || null,
      isFromWhatsApp: createOrderDto.isFromWhatsApp || false,
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
          modifiers: itemDto.modifiers, // Pasar los modificadores aquí
        };
        // Guardar el item y obtener su ID
        const savedOrderItem =
          await this.createOrderItemInternal(createOrderItemDto); // Usar método interno

        // Crear modificadores asociados al item recién guardado
        if (itemDto.modifiers && itemDto.modifiers.length > 0) {
          for (const modifierDto of itemDto.modifiers) {
            await this.createOrderItemModifier({
              orderItemId: savedOrderItem.id,
              productModifierId: modifierDto.productModifierId,
              quantity: modifierDto.quantity,
              price: modifierDto.price,
            });
          }
        }
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
    if (updateOrderDto.phoneNumber !== undefined)
      updatePayload.phoneNumber = updateOrderDto.phoneNumber;
    if (updateOrderDto.customerName !== undefined)
      updatePayload.customerName = updateOrderDto.customerName;
    if (updateOrderDto.deliveryAddress !== undefined)
      updatePayload.deliveryAddress = updateOrderDto.deliveryAddress;

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

      // Eliminar TODOS los items existentes y sus modificadores
      for (const item of existingItems) {
        // Primero eliminar los modificadores del item
        const modifiers =
          await this.orderItemModifierRepository.findByOrderItemId(item.id);
        for (const modifier of modifiers) {
          await this.orderItemModifierRepository.delete(modifier.id);
        }
        // Luego eliminar el item
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
          modifiers: itemDto.modifiers,
        };

        const savedOrderItem =
          await this.createOrderItemInternal(createOrderItemDto);

        // Crear modificadores asociados si existen
        if (itemDto.modifiers && itemDto.modifiers.length > 0) {
          for (const modifierDto of itemDto.modifiers) {
            await this.createOrderItemModifier({
              orderItemId: savedOrderItem.id,
              productModifierId: modifierDto.productModifierId,
              quantity: modifierDto.quantity,
              price: modifierDto.price,
            });
          }
        }
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
    updatedOrderItem.modifiers = existingOrderItem.modifiers;
    updatedOrderItem.createdAt = existingOrderItem.createdAt;
    // updatedAt y deletedAt serán manejados por TypeORM o el repositorio
    updatedOrderItem.deletedAt = existingOrderItem.deletedAt;

    return this.orderItemRepository.update(updatedOrderItem);
  }

  async deleteOrderItem(id: string): Promise<void> {
    const orderItem = await this.findOrderItemById(id);

    // Eliminar primero los modificadores asociados
    const modifiers = await this.findOrderItemModifiersByOrderItemId(id);
    for (const modifier of modifiers) {
      await this.deleteOrderItemModifier(modifier.id);
    }

    await this.orderItemRepository.delete(orderItem.id);
  }

  // OrderItemModifier methods
  // Firma refactorizada para aceptar un objeto
  async createOrderItemModifier(data: {
    orderItemId: string;
    productModifierId: string; // ID del ProductModifier (la opción específica)
    quantity?: number;
    price?: number | null;
  }): Promise<OrderItemModifier> {
    await this.findOrderItemById(data.orderItemId); // Verificar que el orderItem existe

    // TODO: Aquí se podría obtener el precio del catálogo si data.price es null/undefined
    // const productModifier = await this.productModifierRepository.findById(data.productModifierId);
    // const finalPrice = data.price ?? productModifier?.price ?? 0;

    const orderItemModifier = new OrderItemModifier();
    orderItemModifier.id = uuidv4();
    orderItemModifier.orderItemId = data.orderItemId;
    orderItemModifier.productModifierId = data.productModifierId;
    orderItemModifier.quantity = data.quantity ?? 1;
    orderItemModifier.price = data.price ?? 0;

    return this.orderItemModifierRepository.save(orderItemModifier);
  }

  async findOrderItemModifierById(id: string): Promise<OrderItemModifier> {
    const orderItemModifier =
      await this.orderItemModifierRepository.findById(id);

    if (!orderItemModifier) {
      throw new NotFoundException(`OrderItemModifier with ID ${id} not found`);
    }

    return orderItemModifier;
  }

  async findOrderItemModifiersByOrderItemId(
    orderItemId: string,
  ): Promise<OrderItemModifier[]> {
    await this.findOrderItemById(orderItemId); // Verificar que el orderItem existe
    return this.orderItemModifierRepository.findByOrderItemId(orderItemId);
  }

  async updateOrderItemModifier(
    id: string,
    updateOrderItemModifierDto: UpdateOrderItemModifierDto,
  ): Promise<OrderItemModifier> {
    const existingModifier = await this.findOrderItemModifierById(id);

    // Crear objeto con datos actualizados
    const updatedData = {
      ...existingModifier,
      productModifierId:
        updateOrderItemModifierDto.productModifierId ??
        existingModifier.productModifierId,
      quantity:
        updateOrderItemModifierDto.quantity ?? existingModifier.quantity,
      price:
        updateOrderItemModifierDto.price !== undefined
          ? updateOrderItemModifierDto.price
          : existingModifier.price, // Permite null
    };

    // Crear instancia y asignar propiedades
    const updatedModifier = new OrderItemModifier();
    updatedModifier.id = updatedData.id;
    updatedModifier.orderItemId = updatedData.orderItemId;
    updatedModifier.productModifierId = updatedData.productModifierId;
    updatedModifier.quantity = updatedData.quantity;
    updatedModifier.price = updatedData.price ?? 0; // Asegurar que sea number
    // Asignar relaciones y timestamps existentes si es necesario para el repositorio
    updatedModifier.orderItem = existingModifier.orderItem;
    updatedModifier.createdAt = existingModifier.createdAt;
    // updatedAt y deletedAt serán manejados por TypeORM o el repositorio
    updatedModifier.deletedAt = existingModifier.deletedAt;

    // Pasar el objeto creado con lógica de dominio
    return this.orderItemModifierRepository.update(updatedModifier);
  }

  async deleteOrderItemModifier(id: string): Promise<void> {
    const orderItemModifier = await this.findOrderItemModifierById(id);
    await this.orderItemModifierRepository.delete(orderItemModifier.id);
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
