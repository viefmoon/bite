import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { OrderItemEntity } from '../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import {
  KitchenOrderOptimizedDto,
  KitchenOrderItemOptimizedDto,
  ScreenStatusOptimizedDto,
} from '../dto/kitchen-order-optimized.dto';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { PreparationStatus } from '../../orders/domain/order-item';
import {
  PreparationScreenStatus,
  OrderPreparationScreenStatus,
} from '../../orders/domain/order-preparation-screen-status';

@Injectable()
export class KitchenOrderMapperService {
  /**
   * Transforma una entidad de orden a DTO optimizado para cocina
   */
  transformToKitchenOrderOptimized(
    order: OrderEntity,
    userScreenId: string,
    filters: KitchenOrderFilterDto,
    screenStatuses: Map<string, OrderPreparationScreenStatus>,
  ): KitchenOrderOptimizedDto {
    const orderData = {
      ...this.mapBasicOrderDetails(order),
      ...this.mapOrderTypeSpecificFields(order),
      items: this.mapOrderItems(order, userScreenId, filters),
      screenStatuses: this.mapScreenStatuses(screenStatuses),
      myScreenStatus:
        screenStatuses.get(userScreenId)?.status ||
        PreparationScreenStatus.PENDING,
      hasPendingItems: false, // Se calculará después
    };

    // Filtrar items según configuración
    if (!filters.showAllProducts) {
      orderData.items = orderData.items.filter(
        (item) => item.belongsToMyScreen,
      );
    }

    // Calcular si tiene items pendientes
    orderData.hasPendingItems = orderData.items.some(
      (item) =>
        item.belongsToMyScreen &&
        item.preparationStatus !== PreparationStatus.READY,
    );

    return plainToInstance(KitchenOrderOptimizedDto, orderData, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Mapea los detalles básicos de la orden
   */
  private mapBasicOrderDetails(
    order: OrderEntity,
  ): Partial<KitchenOrderOptimizedDto> {
    return {
      id: order.id,
      shiftOrderNumber: order.shiftOrderNumber,
      orderType: order.orderType,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      orderNotes: order.notes || undefined,
    };
  }

  /**
   * Mapea campos específicos según el tipo de orden
   */
  private mapOrderTypeSpecificFields(
    order: OrderEntity,
  ): Partial<KitchenOrderOptimizedDto> {
    const fields: Partial<KitchenOrderOptimizedDto> = {};

    switch (order.orderType) {
      case OrderType.DELIVERY:
        if (order.deliveryInfo) {
          fields.deliveryAddress = order.deliveryInfo.fullAddress;
          fields.deliveryPhone = order.deliveryInfo.recipientPhone;
        }
        break;

      case OrderType.TAKE_AWAY:
        if (order.customer) {
          fields.receiptName = this.getCustomerDisplayName(order.customer);
          fields.customerPhone = order.customer.whatsappPhoneNumber;
        }
        break;

      case OrderType.DINE_IN:
        fields.areaName = order.table?.area?.name;
        fields.tableName = order.table?.name;
        break;
    }

    return fields;
  }

  /**
   * Obtiene el nombre de display del cliente
   */
  private getCustomerDisplayName(customer: any): string {
    const fullName =
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    return fullName || 'Cliente';
  }

  /**
   * Mapea los items de la orden
   */
  private mapOrderItems(
    order: OrderEntity,
    userScreenId: string,
    filters: KitchenOrderFilterDto,
  ): KitchenOrderItemOptimizedDto[] {
    const itemGroups = this.groupOrderItems(
      order.orderItems || [],
      filters.ungroupProducts || false,
    );

    return itemGroups
      .map((group) => this.mapOrderItemGroup(group, userScreenId))
      .filter((item): item is KitchenOrderItemOptimizedDto => item !== null);
  }

  /**
   * Mapea un grupo de items de orden
   */
  private mapOrderItemGroup(
    group: { items: OrderItemEntity[] },
    userScreenId: string,
  ): KitchenOrderItemOptimizedDto | null {
    const item = group.items[0];

    if (!item.product) {
      return null;
    }

    const itemData = {
      id: group.items.map((i) => i.id).join(','),
      productName: item.product.name,
      variantName: item.productVariant?.name,
      modifiers: item.productModifiers?.map((m) => m.name) || [],
      pizzaCustomizations: this.mapPizzaCustomizations(item),
      preparationNotes: item.preparationNotes || undefined,
      preparationStatus: item.preparationStatus,
      preparedAt: item.preparedAt || undefined,
      preparedByUser: this.mapPreparedByUser(item.preparedBy),
      quantity: group.items.length,
      belongsToMyScreen: userScreenId
        ? item.product.preparationScreenId === userScreenId
        : true,
    };

    return plainToInstance(KitchenOrderItemOptimizedDto, itemData, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Mapea las customizaciones de pizza
   */
  private mapPizzaCustomizations(item: OrderItemEntity): any[] | undefined {
    if (!item.selectedPizzaCustomizations?.length) {
      return undefined;
    }

    return item.selectedPizzaCustomizations.map((pc) => ({
      customizationName: pc.pizzaCustomization.name,
      action: pc.action,
      half: pc.half,
    }));
  }

  /**
   * Mapea el usuario que preparó el item
   */
  private mapPreparedByUser(
    preparedBy: any,
  ): { firstName: string; lastName: string } | undefined {
    if (!preparedBy) {
      return undefined;
    }

    return {
      firstName: preparedBy.firstName || '',
      lastName: preparedBy.lastName || '',
    };
  }

  /**
   * Agrupa los items de orden según configuración
   */
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

  /**
   * Genera una clave única para agrupar items similares
   */
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

  /**
   * Mapea los estados de pantalla
   */
  private mapScreenStatuses(
    screenStatuses: Map<string, OrderPreparationScreenStatus>,
  ): ScreenStatusOptimizedDto[] {
    const statuses: ScreenStatusOptimizedDto[] = [];

    for (const [, status] of screenStatuses) {
      if (status.preparationScreen) {
        const statusData = {
          screenId: status.preparationScreenId,
          screenName: status.preparationScreen.name,
          status: status.status,
        };

        const statusDto = plainToInstance(
          ScreenStatusOptimizedDto,
          statusData,
          {
            excludeExtraneousValues: true,
          },
        );

        statuses.push(statusDto);
      }
    }

    return statuses;
  }
}
