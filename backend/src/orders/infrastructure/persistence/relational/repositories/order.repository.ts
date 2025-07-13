import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Between, FindOptionsWhere, Repository, In, Not } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Order } from '../../../../domain/order';
import { FindAllOrdersDto } from '../../../../dto/find-all-orders.dto';
import { OrderRepository } from '../../order.repository';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { ShiftsService } from '../../../../../shifts/shifts.service';
import { BadRequestException } from '@nestjs/common';
@Injectable()
export class OrdersRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @Inject(forwardRef(() => ShiftsService))
    private readonly shiftsService: ShiftsService,
    private readonly orderMapper: OrderMapper,
  ) {}
  async create(data: {
    userId: string | null;
    tableId: string | null;
    scheduledAt?: Date | null;
    orderStatus: string;
    orderType: string;
    subtotal: number;
    total: number;
    notes?: string;
    customerId?: string | null;
    isFromWhatsApp?: boolean;
    deliveryInfo: any;
    estimatedDeliveryTime?: Date | null;
    operationalDate?: Date; // Nueva propiedad opcional para la fecha operacional
  }): Promise<Order> {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      throw new BadRequestException(
        'No hay un turno activo. Debe abrir un turno antes de crear órdenes.',
      );
    }

    // Obtener el próximo número de orden para este turno
    const shiftOrderNumber = await this.getNextShiftOrderNumber(
      currentShift.id,
    );

    const orderToCreate = {
      ...data,
      shiftOrderNumber,
      shiftId: currentShift.id,
    };
    const persistenceModel = this.orderMapper.toEntity(orderToCreate as Order);
    if (!persistenceModel) {
      throw new Error('Failed to map order domain to entity');
    }
    const newEntity = await this.ordersRepository.save(
      this.ordersRepository.create(persistenceModel),
    );
    const completeEntity = await this.ordersRepository.findOne({
      where: { id: newEntity.id },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
    });
    if (!completeEntity) {
      throw new Error(
        `No se pudo cargar la orden creada con ID ${newEntity.id}`,
      );
    }
    const domainResult = this.orderMapper.toDomain(completeEntity);
    if (!domainResult) {
      throw new Error('Failed to map complete order entity to domain');
    }
    return domainResult;
  }
  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllOrdersDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[Order[], number]> {
    const where: FindOptionsWhere<OrderEntity> = {};
    if (filterOptions?.userId) {
      where.userId = filterOptions.userId;
    }
    if (filterOptions?.tableId) {
      where.tableId = filterOptions.tableId;
    }
    if (filterOptions?.shiftId) {
      where.shiftId = filterOptions.shiftId;
    }
    // Soportar tanto un solo estado como múltiples estados
    if (
      filterOptions?.orderStatuses &&
      filterOptions.orderStatuses.length > 0
    ) {
      where.orderStatus = In(filterOptions.orderStatuses);
    } else if (filterOptions?.orderStatus) {
      where.orderStatus = filterOptions.orderStatus;
    }
    if (filterOptions?.orderType) {
      where.orderType = filterOptions.orderType;
    }
    if (filterOptions?.startDate && filterOptions?.endDate) {
      const startDate = new Date(filterOptions.startDate);
      const endDate = new Date(filterOptions.endDate);
      where.createdAt = Between(startDate, endDate);
    } else if (filterOptions?.startDate) {
      const startDate = new Date(filterOptions.startDate);
      where.createdAt = Between(startDate, new Date());
    } else if (filterOptions?.endDate) {
      const endDate = new Date(filterOptions.endDate);
      const startDate = new Date(0);
      where.createdAt = Between(startDate, endDate);
    }
    const [entities, count] = await this.ordersRepository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
    const domainOrders = entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
    return [domainOrders, count];
  }
  async findById(id: Order['id']): Promise<NullableType<Order>> {
    const entity = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
    });
    return entity ? this.orderMapper.toDomain(entity) : null;
  }
  async findByUserId(userId: Order['userId']): Promise<Order[]> {
    if (!userId) return [];
    const entities = await this.ordersRepository.find({
      where: { userId },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
    return entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
  }
  async findByTableId(tableId: Order['tableId']): Promise<Order[]> {
    if (tableId === null) {
      return [];
    }
    const entities = await this.ordersRepository.find({
      where: { tableId },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
    return entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
  }
  async findByShiftId(shiftId: Order['shiftId']): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: { shiftId },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
      order: {
        shiftOrderNumber: 'ASC',
      },
    });
    return entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
  }
  async findOpenOrdersByDate(date: Date): Promise<Order[]> {
    const timeZone = 'America/Mexico_City';
    const localDate = toZonedTime(date, timeZone);
    const startLocal = startOfDay(localDate);
    const endLocal = endOfDay(localDate);
    const startUtc = fromZonedTime(startLocal, timeZone);
    const endUtc = fromZonedTime(endLocal, timeZone);
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .select([
        'order.id',
        'order.shiftOrderNumber',
        'order.shiftId',
        'order.orderType',
        'order.orderStatus',
        'order.subtotal',
        'order.total',
        'order.createdAt',
        'order.estimatedDeliveryTime',
        'order.notes',
      ])
      .leftJoin('order.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName'])
      .leftJoin('order.table', 'table')
      .addSelect(['table.id', 'table.name', 'table.isTemporary'])
      .leftJoin('table.area', 'area')
      .addSelect(['area.id', 'area.name'])
      .leftJoin('order.deliveryInfo', 'deliveryInfo')
      .addSelect([
        'deliveryInfo.recipientName',
        'deliveryInfo.recipientPhone',
        'deliveryInfo.fullAddress',
      ])
      .leftJoin('order.orderItems', 'orderItems')
      .addSelect(['orderItems.id', 'orderItems.preparationStatus'])
      .where('order.createdAt >= :start', { start: startUtc })
      .andWhere('order.createdAt < :end', { end: endUtc })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      })
      .orderBy('order.shiftOrderNumber', 'ASC');
    const entities = await queryBuilder.getMany();
    return entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
  }
  async update(id: Order['id'], payload: Partial<Order>): Promise<Order> {
    const entity = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
    });
    if (!entity) {
      throw new Error('Order not found');
    }
    const existingDomain = this.orderMapper.toDomain(entity);
    if (!existingDomain) {
      throw new Error('Failed to map existing order entity to domain');
    }
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      shiftOrderNumber,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      shiftId,
      ...updateData
    } = payload;

    // Manejar actualización/eliminación de deliveryInfo
    if ('deliveryInfo' in updateData) {
      if (updateData.deliveryInfo === null && entity.deliveryInfo) {
        // Eliminar el registro de deliveryInfo de la base de datos
        await this.ordersRepository.manager.delete('delivery_info', {
          orderId: id,
        });
        entity.deliveryInfo = null;
      } else if (
        updateData.deliveryInfo &&
        typeof updateData.deliveryInfo === 'object'
      ) {
        // Lista de todos los campos posibles de deliveryInfo
        const allFields = [
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
          'latitude',
          'longitude',
          'deliveryInstructions',
        ];

        if (entity.deliveryInfo) {
          // Actualizar deliveryInfo existente, asegurándose de establecer campos como null explícitamente
          const deliveryInfoUpdate: any = {};

          // Establecer explícitamente cada campo, usando null para undefined
          for (const field of allFields) {
            const value = (updateData.deliveryInfo as any)[field];
            deliveryInfoUpdate[field] = value === undefined ? null : value;
          }

          // Actualizar el registro de deliveryInfo
          await this.ordersRepository.manager.update(
            'delivery_info',
            { orderId: id },
            deliveryInfoUpdate,
          );
        } else {
          // Crear nuevo deliveryInfo si no existía
          const deliveryInfoData: any = {
            orderId: id,
          };

          // Establecer cada campo, usando null para undefined
          for (const field of allFields) {
            const value = (updateData.deliveryInfo as any)[field];
            deliveryInfoData[field] = value === undefined ? null : value;
          }

          // Solo crear si hay al menos un campo con valor
          const hasAnyValue = allFields.some(
            (field) =>
              deliveryInfoData[field] !== null &&
              deliveryInfoData[field] !== '',
          );

          if (hasAnyValue) {
            await this.ordersRepository.manager.insert(
              'delivery_info',
              deliveryInfoData,
            );
          }
        }
      }
    }

    const updatedDomain = {
      ...existingDomain,
      ...updateData,
    };
    
    // Logging para debuggear el problema de tableId
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] Actualizando tableId: ${existingDomain.tableId} → ${updateData.tableId}`);
      console.log(`[OrderRepository] updatedDomain.tableId: ${updatedDomain.tableId}`);
    }
    
    const persistenceModel = this.orderMapper.toEntity(updatedDomain);
    if (!persistenceModel) {
      throw new Error('Failed to map updated order domain to entity');
    }
    
    // Logging adicional para persistenceModel
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] persistenceModel.tableId: ${persistenceModel.tableId}`);
    }
    // Manejar delivery_info de manera especial para evitar violaciones de unique constraint
    if (persistenceModel.deliveryInfo) {
      if (entity.deliveryInfo) {
        // Si ya existe delivery_info, preservar su ID y actualizar los campos
        persistenceModel.deliveryInfo.id = entity.deliveryInfo.id;
        persistenceModel.deliveryInfo.createdAt = entity.deliveryInfo.createdAt;
        // Mantener la misma instancia de entity para que TypeORM reconozca que es una actualización
        entity.deliveryInfo = persistenceModel.deliveryInfo;
      }
    } else if (persistenceModel.deliveryInfo === null && entity.deliveryInfo) {
      // Si se debe eliminar delivery_info, establecer la relación a null
      entity.deliveryInfo = null;
    }
    
    // Usar merge en lugar de create para preservar la instancia original
    // y permitir que el subscriber detecte correctamente la actualización
    const mergedEntity = this.ordersRepository.merge(entity, persistenceModel);
    
    // Logging adicional del merge
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] entity.tableId antes del merge: ${entity.tableId}`);
      console.log(`[OrderRepository] mergedEntity.tableId después del merge: ${mergedEntity.tableId}`);
    }
    
    // FUERZA BRUTA: Si tableId está en updateData, aplicarlo directamente a la entidad
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] Forzando tableId = ${updateData.tableId}`);
      mergedEntity.tableId = updateData.tableId === undefined ? null : updateData.tableId;
    }
    
    const updatedEntity = await this.ordersRepository.save(mergedEntity);
    
    // Logging después del save
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] updatedEntity.tableId después del save: ${updatedEntity.tableId}`);
    }
    const completeEntity = await this.ordersRepository.findOne({
      where: { id: updatedEntity.id },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
      ],
    });
    if (!completeEntity) {
      throw new Error(
        `No se pudo cargar la orden actualizada con ID ${updatedEntity.id}`,
      );
    }
    const finalDomainResult = this.orderMapper.toDomain(completeEntity);
    if (!finalDomainResult) {
      throw new Error('Failed to map final updated order entity to domain');
    }
    
    // Logging final
    if ('tableId' in updateData) {
      console.log(`[OrderRepository] completeEntity.tableId: ${completeEntity.tableId}`);
      console.log(`[OrderRepository] finalDomainResult.tableId: ${finalDomainResult.tableId}`);
    }
    
    return finalDomainResult;
  }
  async remove(id: Order['id']): Promise<void> {
    await this.ordersRepository.softDelete(id);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: [
        'user',
        'table',
        'shift',
        'orderItems',
        'payments',
        'deliveryInfo',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return entities
      .map((entity) => this.orderMapper.toDomain(entity))
      .filter((order): order is Order => order !== null);
  }

  async findByStatus(statuses: string[]): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: {
        orderStatus: In(statuses as any),
      },
      relations: [
        'user',
        'table',
        'shift',
        'orderItems',
        'payments',
        'deliveryInfo',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return entities
      .map((entity) => this.orderMapper.toDomain(entity))
      .filter((order): order is Order => order !== null);
  }
  async findOrdersForFinalization(): Promise<Order[]> {
    // Obtener el turno actual
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      // Si no hay turno activo, retornar array vacío
      return [];
    }

    const entities = await this.ordersRepository.find({
      where: {
        // Filtrar solo órdenes del turno actual
        shiftId: currentShift.id,
        // Excluir órdenes con estado completado o cancelado
        orderStatus: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED])),
      },
      relations: [
        'user',
        'table',
        'table.area',
        'shift',
        'orderItems',
        'orderItems.product',
        'orderItems.product.preparationScreen',
        'orderItems.productVariant',
        'orderItems.productModifiers',
        'orderItems.preparedBy',
        'orderItems.selectedPizzaCustomizations',
        'orderItems.selectedPizzaCustomizations.pizzaCustomization',
        'payments',
        'adjustments',
        'deliveryInfo',
        'preparationScreenStatuses',
        'preparationScreenStatuses.preparationScreen',
      ],
      order: {
        createdAt: 'ASC',
      },
    });
    return entities
      .map((entity) => this.orderMapper.toDomain(entity))
      .filter(Boolean) as Order[];
  }

  private async getNextShiftOrderNumber(shiftId: string): Promise<number> {
    // Obtener el último número de orden del turno actual
    const lastOrder = await this.ordersRepository.findOne({
      where: { shiftId },
      order: { shiftOrderNumber: 'DESC' },
      select: ['shiftOrderNumber'],
    });

    return lastOrder ? lastOrder.shiftOrderNumber + 1 : 1;
  }
}
