import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import { OrderStatus } from '../../orders/domain/enums/order-status.enum';

@Injectable()
export class KitchenOrderQueryBuilderService {
  /**
   * Construye el query base para órdenes de cocina con todas las relaciones necesarias
   */
  buildBaseQuery(orderRepository: Repository<OrderEntity>): SelectQueryBuilder<OrderEntity> {
    return orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('orderItem.productVariant', 'variant')
      .leftJoinAndSelect('orderItem.productModifiers', 'modifiers')
      .leftJoinAndSelect('orderItem.selectedPizzaCustomizations', 'pizzaCustomizations')
      .leftJoinAndSelect('pizzaCustomizations.pizzaCustomization', 'customization')
      .leftJoinAndSelect('orderItem.preparedBy', 'preparedBy')
      .leftJoinAndSelect('o.table', 'table')
      .leftJoinAndSelect('table.area', 'area')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.deliveryInfo', 'deliveryInfo')
      .leftJoinAndSelect('o.preparationScreenStatuses', 'screenStatus')
      .leftJoinAndSelect('screenStatus.preparationScreen', 'screen')
      .leftJoinAndSelect('screenStatus.startedBy', 'startedBy')
      .leftJoinAndSelect('screenStatus.completedBy', 'completedBy')
      .where('1=1');
  }

  /**
   * Aplica filtros al query según los criterios especificados
   */
  applyFilters(
    queryBuilder: SelectQueryBuilder<OrderEntity>,
    filters: KitchenOrderFilterDto,
    userScreenId: string | null,
  ): SelectQueryBuilder<OrderEntity> {
    // Filtrar por tipo de orden
    if (filters.orderType) {
      queryBuilder.andWhere('o.orderType = :orderType', {
        orderType: filters.orderType,
      });
    }

    // Filtrar por pantalla específica si no se muestran todos los productos
    if (!filters.showAllProducts && userScreenId) {
      this.applyScreenFilter(queryBuilder, userScreenId);
    }

    // Excluir órdenes completadas o canceladas
    this.applyStatusFilter(queryBuilder);

    // Ordenar por fecha de creación
    queryBuilder.orderBy('o.createdAt', 'ASC');

    return queryBuilder;
  }

  /**
   * Aplica filtro por pantalla de preparación
   */
  private applyScreenFilter(
    queryBuilder: SelectQueryBuilder<OrderEntity>,
    userScreenId: string,
  ): void {
    queryBuilder.andWhere(
      qb => {
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

  /**
   * Aplica filtro de estados excluidos
   */
  private applyStatusFilter(queryBuilder: SelectQueryBuilder<OrderEntity>): void {
    queryBuilder.andWhere('o.orderStatus NOT IN (:...excludedStatuses)', {
      excludedStatuses: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    });
  }

  /**
   * Construye y ejecuta el query completo para obtener órdenes de cocina
   */
  async buildAndExecuteQuery(
    orderRepository: Repository<OrderEntity>,
    filters: KitchenOrderFilterDto,
    userScreenId: string | null,
  ): Promise<OrderEntity[]> {
    const queryBuilder = this.buildBaseQuery(orderRepository);
    this.applyFilters(queryBuilder, filters, userScreenId);
    return await queryBuilder.getMany();
  }
}