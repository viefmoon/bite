import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import { OrderPreparationScreenStatusMapper } from '../../orders/infrastructure/persistence/relational/mappers/order-preparation-screen-status.mapper';
import {
  PreparationScreenStatus,
  OrderPreparationScreenStatus,
} from '../../orders/domain/order-preparation-screen-status';

@Injectable()
export class ScreenStatusProcessorService {
  constructor(
    private readonly screenStatusMapper: OrderPreparationScreenStatusMapper,
  ) {}

  /**
   * Procesa los estados de pantalla desde las órdenes cargadas
   */
  processScreenStatusesFromOrders(
    orders: OrderEntity[],
  ): Map<string, Map<string, OrderPreparationScreenStatus>> {
    const statusMap = new Map<string, Map<string, OrderPreparationScreenStatus>>();

    orders.forEach(order => {
      const orderStatusMap = this.processOrderScreenStatuses(order);
      statusMap.set(order.id, orderStatusMap);
    });

    return statusMap;
  }

  /**
   * Procesa los estados de pantalla de una orden específica
   */
  private processOrderScreenStatuses(
    order: OrderEntity,
  ): Map<string, OrderPreparationScreenStatus> {
    const orderStatusMap = new Map<string, OrderPreparationScreenStatus>();

    if (order.preparationScreenStatuses?.length) {
      order.preparationScreenStatuses.forEach(statusEntity => {
        const domainStatus = this.screenStatusMapper.toDomain(statusEntity);
        if (domainStatus) {
          orderStatusMap.set(statusEntity.preparationScreenId, domainStatus);
        }
      });
    }

    return orderStatusMap;
  }

  /**
   * Filtra órdenes basándose en el estado de la pantalla del usuario
   */
  filterOrdersByScreenStatus(
    orders: OrderEntity[],
    screenStatuses: Map<string, Map<string, OrderPreparationScreenStatus>>,
    userScreenId: string | null,
    filters: KitchenOrderFilterDto,
  ): OrderEntity[] {
    if (!userScreenId) {
      return orders;
    }

    return orders.filter(order => {
      const screenStatus = screenStatuses.get(order.id)?.get(userScreenId);
      return this.shouldIncludeOrder(screenStatus, filters.showPrepared);
    });
  }

  /**
   * Determina si una orden debe incluirse según su estado de pantalla
   */
  private shouldIncludeOrder(
    screenStatus: OrderPreparationScreenStatus | undefined,
    showPrepared: boolean | undefined,
  ): boolean {
    if (showPrepared) {
      // Solo mostrar si la pantalla tiene estado READY
      return screenStatus?.status === PreparationScreenStatus.READY;
    } else {
      // Mostrar si no existe estado o no está READY
      return !screenStatus || screenStatus.status !== PreparationScreenStatus.READY;
    }
  }

  /**
   * Obtiene el estado de una pantalla específica para una orden
   */
  getScreenStatusForOrder(
    orderId: string,
    screenId: string,
    screenStatuses: Map<string, Map<string, OrderPreparationScreenStatus>>,
  ): OrderPreparationScreenStatus | undefined {
    return screenStatuses.get(orderId)?.get(screenId);
  }

  /**
   * Verifica si todas las pantallas de una orden están listas
   */
  areAllScreensReady(
    screenIds: Set<string>,
    orderScreenStatuses: Map<string, OrderPreparationScreenStatus>,
  ): boolean {
    for (const screenId of screenIds) {
      const status = orderScreenStatuses.get(screenId);
      if (!status || status.status !== PreparationScreenStatus.READY) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica si alguna pantalla está en preparación
   */
  isAnyScreenInPreparation(
    screenIds: Set<string>,
    orderScreenStatuses: Map<string, OrderPreparationScreenStatus>,
  ): boolean {
    for (const screenId of screenIds) {
      const status = orderScreenStatuses.get(screenId);
      if (status?.status === PreparationScreenStatus.IN_PREPARATION) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene todas las pantallas únicas que tienen productos en una orden
   */
  getUniqueScreenIds(order: OrderEntity): Set<string> {
    const screenIds = new Set<string>();
    
    order.orderItems?.forEach(item => {
      if (item.product?.preparationScreenId) {
        screenIds.add(item.product.preparationScreenId);
      }
    });

    return screenIds;
  }
}