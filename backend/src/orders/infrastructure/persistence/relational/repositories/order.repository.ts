import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Between, FindOptionsWhere, Repository, In } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Order } from '../../../../domain/order';
import { FindAllOrdersDto } from '../../../../dto/find-all-orders.dto';
import { OrderRepository } from '../../order.repository';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { DAILY_ORDER_COUNTER_REPOSITORY } from '../../../../../common/tokens';
import { DailyOrderCounterRepository } from '../../daily-order-counter.repository';

@Injectable()
export class OrdersRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @Inject(DAILY_ORDER_COUNTER_REPOSITORY)
    private readonly dailyOrderCounterRepository: DailyOrderCounterRepository,
    private readonly orderMapper: OrderMapper,
  ) {}

  async create(
    data: Omit<
      Order,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'dailyNumber'
    >,
  ): Promise<Order> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counter =
      await this.dailyOrderCounterRepository.findOrCreateByDate(today);

    const updatedCounter =
      await this.dailyOrderCounterRepository.incrementCounter(counter.id);

    const orderToCreate = {
      ...data,
      dailyNumber: updatedCounter.currentNumber,
      dailyOrderCounterId: updatedCounter.id,
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
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
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

    if (filterOptions?.dailyOrderCounterId) {
      where.dailyOrderCounterId = filterOptions.dailyOrderCounterId;
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
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
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
        'dailyOrderCounter',
        'orderItems',
        'orderItems.product',
        'orderItems.productVariant',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
      ],
    });

    return entity ? this.orderMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: Order['userId']): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: { userId },
      relations: [
        'user',
        'table',
        'table.area',
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
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
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return entities
      .map((order) => this.orderMapper.toDomain(order))
      .filter((order): order is Order => order !== null);
  }

  async findByDailyOrderCounterId(
    dailyOrderCounterId: Order['dailyOrderCounterId'],
  ): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: { dailyOrderCounterId },
      relations: [
        'user',
        'table',
        'table.area',
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
      ],
      order: {
        dailyNumber: 'ASC',
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
    const startUtc = startLocal;
    const endUtc = endLocal;

    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('table.area', 'area')
      .leftJoinAndSelect('order.dailyOrderCounter', 'dailyOrderCounter')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orderItems.productVariant', 'productVariant')
      .leftJoinAndSelect('orderItems.modifiers', 'modifiers')
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('order.adjustments', 'adjustments')
      .where('order.createdAt >= :start', { start: startUtc })
      .andWhere('order.createdAt < :end', { end: endUtc })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      })
      .orderBy('order.dailyNumber', 'ASC');

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
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
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
      dailyNumber,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      dailyOrderCounterId,
      ...updateData
    } = payload;

    const updatedDomain = {
      ...existingDomain,
      ...updateData,
    };

    const persistenceModel = this.orderMapper.toEntity(updatedDomain);
    if (!persistenceModel) {
      throw new Error('Failed to map updated order domain to entity');
    }

    // Usar merge en lugar de create para preservar la instancia original
    // y permitir que el subscriber detecte correctamente la actualización
    const mergedEntity = this.ordersRepository.merge(entity, persistenceModel);
    const updatedEntity = await this.ordersRepository.save(mergedEntity);

    const completeEntity = await this.ordersRepository.findOne({
      where: { id: updatedEntity.id },
      relations: [
        'user',
        'table',
        'table.area',
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
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
    return finalDomainResult;
  }

  async remove(id: Order['id']): Promise<void> {
    await this.ordersRepository.softDelete(id);
  }

  async findOrdersForFinalization(): Promise<Order[]> {
    const entities = await this.ordersRepository.find({
      where: {
        orderStatus: In([OrderStatus.READY, OrderStatus.DELIVERED]),
      },
      relations: [
        'user',
        'table',
        'table.area',
        'dailyOrderCounter',
        'orderItems',
        'orderItems.modifiers',
        'orderItems.modifiers.modifier',
        'payments',
        'adjustments',
      ],
      order: {
        createdAt: 'ASC',
      },
    });

    return entities
      .map((entity) => this.orderMapper.toDomain(entity))
      .filter(Boolean) as Order[];
  }
}
