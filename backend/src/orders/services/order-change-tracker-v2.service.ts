import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrderEntity } from '../infrastructure/persistence/relational/entities/order.entity';
import { OrderHistoryEntity } from '../infrastructure/persistence/relational/entities/order-history.entity';
import { classToPlain } from 'class-transformer';

export interface ConsolidatedChangesV2 {
  order?: {
    fields?: any;
    deliveryInfo?: any;
  };
  items?: {
    added?: any[];
    modified?: any[];
    removed?: any[];
  };
}

@Injectable()
export class OrderChangeTrackerV2Service {
  async trackOrderWithItems(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    order: OrderEntity,
    previousState: OrderEntity | null,
    changedBy: string,
    manager: EntityManager,
  ): Promise<void> {
    let changes: ConsolidatedChangesV2 | null = null;

    if (operation === 'INSERT') {
      changes = this.createInsertDiff(order);
    } else if (operation === 'UPDATE' && previousState) {
      changes = this.detectChangesUsingSnapshots(order, previousState);
    }

    if (changes || operation !== 'UPDATE') {
      const historyRecord = manager.create(OrderHistoryEntity, {
        orderId: order.id,
        operation,
        changedBy,
        diff: changes,
        snapshot: this.createOrderSnapshot(order),
      });

      await manager.save(historyRecord);
    }
  }

  private createInsertDiff(order: OrderEntity): ConsolidatedChangesV2 {
    const changes: ConsolidatedChangesV2 = {};

    changes.order = {
      fields: {
        orderType: [null, order.orderType],
        orderStatus: [null, order.orderStatus],
        ...(order.tableId && { tableId: [null, order.tableId] }),
        ...(order.notes && { notes: [null, order.notes] }),
      },
    };

    if (order.deliveryInfo) {
      changes.order.deliveryInfo = {};
      const info = order.deliveryInfo;
      if (info.recipientName)
        changes.order.deliveryInfo.recipientName = [null, info.recipientName];
      if (info.recipientPhone)
        changes.order.deliveryInfo.recipientPhone = [null, info.recipientPhone];
      if (info.fullAddress)
        changes.order.deliveryInfo.fullAddress = [null, info.fullAddress];
    }

    if (order.orderItems && order.orderItems.length > 0) {
      changes.items = {
        added: order.orderItems.map((item) => this.createItemSnapshot(item)),
      };
    }

    return changes;
  }

  detectChangesUsingSnapshots(
    current: OrderEntity,
    previous: OrderEntity,
  ): ConsolidatedChangesV2 | null {
    const changes: ConsolidatedChangesV2 = {};
    let hasChanges = false;

    const orderFieldChanges = this.detectOrderFieldChanges(current, previous);
    if (orderFieldChanges) {
      changes.order = orderFieldChanges;
      hasChanges = true;
    }

    const currentSnapshot = this.createOrderSnapshot(current);
    const previousSnapshot = this.createOrderSnapshot(previous);

    const itemChanges = this.compareItemSnapshots(
      currentSnapshot.orderItems || [],
      previousSnapshot.orderItems || [],
    );

    if (itemChanges) {
      changes.items = itemChanges;
      hasChanges = true;
    }

    if (!hasChanges) return null;

    return changes;
  }

  /**
   * Detecta solo cambios estructurales que afectan el ticket de preparación
   * Excluye cambios en estados, pagos, y otros campos que no requieren reimpresión
   */
  detectStructuralChangesOnly(
    current: OrderEntity,
    previous: OrderEntity,
  ): boolean {
    // 1. Detectar cambios en campos estructurales de la orden
    const structuralFields = ['notes', 'scheduledAt', 'estimatedDeliveryTime'];
    let hasStructuralChanges = false;

    for (const field of structuralFields) {
      const currentValue = (current as any)[field];
      const previousValue = (previous as any)[field];

      if (field === 'estimatedDeliveryTime' || field === 'scheduledAt') {
        const currentTime = currentValue
          ? new Date(currentValue).getTime()
          : null;
        const previousTime = previousValue
          ? new Date(previousValue).getTime()
          : null;

        if (currentTime !== previousTime) {
          hasStructuralChanges = true;
          break;
        }
      } else if (currentValue !== previousValue) {
        hasStructuralChanges = true;
        break;
      }
    }

    // 2. Detectar cambios en deliveryInfo (información de entrega)
    if (current.deliveryInfo || previous.deliveryInfo) {
      const deliveryChanges = this.compareDeliveryInfo(
        previous.deliveryInfo || {},
        current.deliveryInfo || {},
      );

      if (deliveryChanges) {
        hasStructuralChanges = true;
      }
    }

    // 3. Detectar cambios en items (lo más importante)
    const currentSnapshot = this.createOrderSnapshot(current);
    const previousSnapshot = this.createOrderSnapshot(previous);

    const itemChanges = this.compareItemSnapshots(
      currentSnapshot.orderItems || [],
      previousSnapshot.orderItems || [],
    );

    if (itemChanges) {
      hasStructuralChanges = true;
    }

    return hasStructuralChanges;
  }

  private detectOrderFieldChanges(
    current: OrderEntity,
    previous: OrderEntity,
  ): any {
    const fields: any = {};
    let hasChanges = false;

    // Comparar campos simples
    const compareFields = [
      'orderStatus',
      'orderType',
      'notes',
      'tableId',
      'customerId',
      'scheduledAt',
      'estimatedDeliveryTime',
      'isFromWhatsApp',
    ];

    for (const field of compareFields) {
      const currentValue = (current as any)[field];
      const previousValue = (previous as any)[field];

      // Para fechas, comparar como timestamps
      if (field === 'estimatedDeliveryTime' || field === 'scheduledAt') {
        const currentTime = currentValue
          ? new Date(currentValue).getTime()
          : null;
        const previousTime = previousValue
          ? new Date(previousValue).getTime()
          : null;

        if (currentTime !== previousTime) {
          fields[field] = [previousValue, currentValue];
          hasChanges = true;
        }
      } else if (currentValue !== previousValue) {
        fields[field] = [previousValue, currentValue];
        hasChanges = true;
      }
    }

    // Comparar deliveryInfo
    if (current.deliveryInfo || previous.deliveryInfo) {
      const deliveryChanges = this.compareDeliveryInfo(
        previous.deliveryInfo || {},
        current.deliveryInfo || {},
      );

      if (deliveryChanges) {
        return {
          fields: hasChanges ? fields : undefined,
          deliveryInfo: deliveryChanges,
        };
      }
    }

    return hasChanges ? { fields } : null;
  }

  private compareDeliveryInfo(previous: any, current: any): any {
    const fields = [
      'recipientName',
      'recipientPhone',
      'fullAddress',
      'deliveryInstructions',
    ];
    const changes: any = {};
    let hasChanges = false;

    for (const field of fields) {
      if (previous[field] !== current[field]) {
        changes[field] = [previous[field], current[field]];
        hasChanges = true;
      }
    }

    return hasChanges ? changes : null;
  }

  private compareItemSnapshots(currentItems: any[], previousItems: any[]): any {
    const changes: any = {};

    // Crear mapas por ID
    const currentMap = new Map(currentItems.map((item) => [item.id, item]));
    const previousMap = new Map(previousItems.map((item) => [item.id, item]));

    // Detectar items agregados
    const added: any[] = [];
    for (const [id, item] of currentMap) {
      if (!previousMap.has(id)) {
        added.push(this.normalizeItemSnapshot(item));
      }
    }

    const removed: any[] = [];
    for (const [id, item] of previousMap) {
      if (!currentMap.has(id)) {
        removed.push(this.normalizeItemSnapshot(item));
      }
    }

    const modified: any[] = [];
    for (const [id, currentItem] of currentMap) {
      const previousItem = previousMap.get(id);
      if (previousItem) {
        const itemChanges = this.detectItemChanges(currentItem, previousItem);
        if (itemChanges.length > 0) {
          modified.push({
            id,
            before: this.normalizeItemSnapshot(previousItem),
            after: this.normalizeItemSnapshot(currentItem),
          });
        }
      }
    }

    if (added.length > 0) changes.added = added;
    if (modified.length > 0) changes.modified = modified;
    if (removed.length > 0) changes.removed = removed;

    return Object.keys(changes).length > 0 ? changes : null;
  }

  private detectItemChanges(current: any, previous: any): string[] {
    const changes: string[] = [];

    if (
      current.productId !== previous.productId ||
      current.productName !== previous.productName
    ) {
      changes.push('producto');
    }

    if (
      current.variantId !== previous.variantId ||
      current.variantName !== previous.variantName
    ) {
      changes.push('variante');
    }

    const currentPrice = parseFloat(current.finalPrice || current.price || '0');
    const previousPrice = parseFloat(
      previous.finalPrice || previous.price || '0',
    );
    if (Math.abs(currentPrice - previousPrice) > 0.01) {
      changes.push('precio');
    }

    const currentMods = JSON.stringify((current.modifiers || []).sort());
    const previousMods = JSON.stringify((previous.modifiers || []).sort());
    if (currentMods !== previousMods) {
      changes.push('modificadores');
    }

    const currentCustom = JSON.stringify((current.customizations || []).sort());
    const previousCustom = JSON.stringify(
      (previous.customizations || []).sort(),
    );
    if (currentCustom !== previousCustom) {
      changes.push('personalizaciones');
    }

    if (current.preparationNotes !== previous.preparationNotes) {
      changes.push('notas');
    }

    if (current.preparationStatus !== previous.preparationStatus) {
      changes.push('estado_preparacion');
    }

    return changes;
  }

  private normalizeItemSnapshot(item: any): any {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName || 'Producto',
      variantId: item.variantId,
      variantName: item.variantName,
      quantity: 1,
      modifiers: item.modifiers || [],
      customizations: item.customizations || [],
      finalPrice: parseFloat(item.finalPrice || item.price || '0'),
      basePrice: parseFloat(item.basePrice || '0'),
      preparationNotes: item.preparationNotes || item.notes || undefined,
      preparationStatus: item.preparationStatus,
    };
  }

  private createItemSnapshot(item: any): any {
    const snapshot = {
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || item.productName || 'Producto',
      variantId: item.productVariantId || item.variantId,
      variantName: item.productVariant?.name || item.variantName,
      basePrice: item.basePrice,
      finalPrice: item.finalPrice,
      preparationStatus: item.preparationStatus,
      preparationNotes: item.preparationNotes,
      modifiers:
        item.productModifiers?.map((m: any) => m.name) || item.modifiers || [],
      customizations: this.formatPizzaCustomizationsForHistory(item.selectedPizzaCustomizations) ||
        item.customizations ||
        [],
    };

    return snapshot;
  }

  private createOrderSnapshot(order: OrderEntity): any {
    const snapshot = classToPlain(order);

    if (order.orderItems) {
      snapshot.orderItems = order.orderItems.map((item) =>
        this.createItemSnapshot(item),
      );
    }

    return snapshot;
  }

  private formatPizzaCustomizationsForHistory(selectedPizzaCustomizations: any[] = []): string[] {
    if (!selectedPizzaCustomizations || selectedPizzaCustomizations.length === 0) {
      return [];
    }

    const fullPizza: any[] = [];
    const half1: any[] = [];
    const half2: any[] = [];

    // Agrupar por mitades
    selectedPizzaCustomizations.forEach((customization) => {
      switch (customization.half) {
        case 'FULL':
          fullPizza.push(customization);
          break;
        case 'HALF_1':
          half1.push(customization);
          break;
        case 'HALF_2':
          half2.push(customization);
          break;
      }
    });

    const formatHalf = (customizations: any[]): string => {
      const flavors: string[] = [];
      const addedIngredients: string[] = [];
      const removedIngredients: string[] = [];

      customizations.forEach((customization) => {
        const customData = customization.pizzaCustomization;
        if (!customData) return;

        if (customData.type === 'FLAVOR') {
          flavors.push(customData.name);
        } else if (customData.type === 'INGREDIENT') {
          if (customization.action === 'ADD') {
            addedIngredients.push(customData.name);
          } else if (customization.action === 'REMOVE') {
            removedIngredients.push(customData.name);
          }
        }
      });

      const parts: string[] = [];

      if (flavors.length > 0) {
        parts.push(flavors.join(' - '));
      }

      if (addedIngredients.length > 0) {
        parts.push(`con ${addedIngredients.join(', ')}`);
      }

      if (removedIngredients.length > 0) {
        parts.push(`sin ${removedIngredients.join(', ')}`);
      }

      return parts.join(', ');
    };

    // Si es pizza completa
    if (fullPizza.length > 0) {
      const formatted = formatHalf(fullPizza);
      return formatted ? [formatted] : [];
    }

    // Si es pizza por mitades
    const halfParts: string[] = [];

    if (half1.length > 0) {
      const half1Formatted = formatHalf(half1);
      if (half1Formatted) {
        halfParts.push(half1Formatted);
      }
    }

    if (half2.length > 0) {
      const half2Formatted = formatHalf(half2);
      if (half2Formatted) {
        halfParts.push(half2Formatted);
      }
    }

    return halfParts.length > 0 ? [halfParts.join(' / ')] : [];
  }
}
