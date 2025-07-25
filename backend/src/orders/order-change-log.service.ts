import { Injectable, Inject } from '@nestjs/common';
import { OrderHistoryRepository } from './infrastructure/persistence/order-history.repository';
import { UsersService } from '../users/users.service';
import { ORDER_HISTORY_REPOSITORY } from '../common/tokens';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { OrderHistoryEntity } from './infrastructure/persistence/relational/entities/order-history.entity';
import { User } from '../users/domain/user';
export class EnrichedOrderHistoryDto extends OrderHistoryEntity {
  changedByUser?: Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'username'
  > | null;
  formattedChanges?: Record<string, any>;
}

@Injectable()
export class OrderChangeLogService {
  constructor(
    @Inject(ORDER_HISTORY_REPOSITORY)
    private readonly historyRepository: OrderHistoryRepository,
    private readonly usersService: UsersService,
  ) {}

  async findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[EnrichedOrderHistoryDto[], number]> {
    const [logs, totalCount] = await this.historyRepository.findByOrderId(
      orderId,
      paginationOptions,
    );

    if (logs.length === 0) {
      return [[], totalCount];
    }

    const userIds = [...new Set(logs.map((log) => log.changedBy))].filter(
      (id): id is string => !!id,
    );

    let userMap = new Map<
      string,
      Pick<User, 'id' | 'firstName' | 'lastName' | 'username'>
    >();
    if (userIds.length > 0) {
      try {
        const users = await this.usersService.findByIds(userIds);
        userMap = new Map(
          users.map((u) => [
            u.id,
            {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              username: u.username,
            },
          ]),
        );
      } catch {}
    }

    const enrichedLogs = logs.map((log) => {
      const user = log.changedBy ? userMap.get(log.changedBy) : null;
      const enrichedLog = new EnrichedOrderHistoryDto();
      Object.assign(enrichedLog, log);
      enrichedLog.changedByUser = user || null;

      if (log.diff) {
        if (log.diff.order || log.diff.items || log.diff.summary) {
          enrichedLog.diff = log.diff;
          enrichedLog.formattedChanges = this.formatChanges(log.diff);
        } else if (log.operation === 'UPDATE') {
          enrichedLog.formattedChanges = this.formatChanges(log.diff);
        }
      }

      return enrichedLog;
    });

    return [enrichedLogs, totalCount];
  }

  private formatChanges(diff: any): Record<string, any> {
    const formatted: Record<string, any> = {};

    if (diff && (diff.order || diff.items || diff.summary)) {
      if (diff.summary) {
        formatted['Resumen'] = diff.summary;
      }

      if (diff.order) {
        if (diff.order.fields) {
          formatted['Cambios en la orden'] = this.formatOrderFields(
            diff.order.fields,
          );
        }
        if (diff.order.deliveryInfo) {
          formatted['Información de entrega'] = this.formatDeliveryInfo(
            diff.order.deliveryInfo,
          );
        }
      }

      if (diff.items) {
        formatted['Cambios en productos'] = this.formatConsolidatedItemChanges(
          diff.items,
        );
      }

      return formatted;
    }

    return this.formatOrderChanges(diff);
  }

  private formatOrderChanges(diff: any): Record<string, any> {
    const formatted: Record<string, any> = {};

    const fieldLabels: Record<string, string> = {
      orderStatus: 'Estado de la orden',
      orderType: 'Tipo de orden',
      total: 'Total',
      subtotal: 'Subtotal',
      notes: 'Notas',
      tableId: 'Mesa',
      customerId: 'Cliente',
      deliveryInfo: 'Información de entrega',
      scheduledAt: 'Hora programada',
      estimatedDeliveryTime: 'Tiempo estimado de entrega',
      isFromWhatsApp: 'Origen WhatsApp',
    };

    const valueFormatters: Record<string, (value: any) => string> = {
      orderStatus: (value) => {
        const statusMap: Record<string, string> = {
          PENDING: 'Pendiente',
          IN_PROGRESS: 'En Progreso',
          READY: 'Lista',
          DELIVERED: 'Entregada',
          COMPLETED: 'Completada',
          CANCELLED: 'Cancelada',
        };
        return statusMap[value] || value;
      },
      orderType: (value) => {
        const typeMap: Record<string, string> = {
          DINE_IN: 'Para Comer Aquí',
          TAKE_AWAY: 'Para Llevar',
          DELIVERY: 'Domicilio',
        };
        return typeMap[value] || value;
      },
      total: (value) => `$${value}`,
      subtotal: (value) => `$${value}`,
      scheduledAt: (value) =>
        value ? new Date(value).toLocaleString('es-MX') : 'No programada',
      estimatedDeliveryTime: (value) =>
        value ? new Date(value).toLocaleString('es-MX') : 'No especificado',
      isFromWhatsApp: (value) => (value ? 'Sí' : 'No'),
      deliveryInfo: (value) => {
        if (!value || typeof value !== 'object') return value;
        const parts: string[] = [];
        if (value.recipientName) parts.push(`Cliente: ${value.recipientName}`);
        if (value.recipientPhone) parts.push(`Tel: ${value.recipientPhone}`);
        if (value.fullAddress) parts.push(`Dirección: ${value.fullAddress}`);
        return parts.join(', ');
      },
    };

    for (const [field, change] of Object.entries(diff)) {
      if (change && typeof change === 'object') {
        const label = fieldLabels[field] || field;
        const formatter = valueFormatters[field];

        if (Array.isArray(change) && change.length >= 2) {
          const [oldValue, newValue] = change;
          formatted[label] = {
            anterior: formatter ? formatter(oldValue) : oldValue,
            nuevo: formatter ? formatter(newValue) : newValue,
          };
        }
      }
    }

    return formatted;
  }

  private formatConsolidatedItemChanges(items: any): any {
    const formatted: any = {};

    // Items agregados - Simplificado para la app
    if (items.added && items.added.length > 0) {
      formatted['Productos agregados'] = items.added.map(
        (item: any) =>
          item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
      );
    }

    // Items modificados - Simplificado mostrando antes y después
    if (items.modified && items.modified.length > 0) {
      formatted['Productos modificados'] = items.modified.map(
        (change: any) => ({
          antes:
            change.before.productName +
            (change.before.variantName
              ? ` - ${change.before.variantName}`
              : ''),
          después:
            change.after.productName +
            (change.after.variantName ? ` - ${change.after.variantName}` : ''),
        }),
      );
    }

    // Items eliminados - Simplificado para la app
    if (items.removed && items.removed.length > 0) {
      formatted['Productos eliminados'] = items.removed.map(
        (item: any) =>
          item.productName + (item.variantName ? ` - ${item.variantName}` : ''),
      );
    }

    return formatted;
  }

  private formatOrderFields(fields: any): any {
    const formatted: any = {};

    for (const [field, change] of Object.entries(fields)) {
      if (Array.isArray(change) && change.length === 2) {
        const [before, after] = change;
        const label = this.getFieldLabel(field);
        const formatter = this.getFieldFormatter(field);

        formatted[label] = {
          anterior: formatter(before),
          nuevo: formatter(after),
        };
      }
    }

    return formatted;
  }

  private formatDeliveryInfo(deliveryDiff: any): any {
    const formatted: any = {};

    // Manejar cambios en campos individuales de deliveryInfo
    for (const [field, change] of Object.entries(deliveryDiff)) {
      if (Array.isArray(change) && change.length === 2) {
        const [before, after] = change;
        const label = this.getDeliveryFieldLabel(field);
        formatted[label] = {
          anterior: before || 'No especificado',
          nuevo: after || 'No especificado',
        };
      }
    }

    return formatted;
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      orderStatus: 'Estado de la orden',
      orderType: 'Tipo de orden',
      notes: 'Notas',
      tableId: 'Mesa',
      customerId: 'Cliente',
      scheduledAt: 'Hora programada',
      estimatedDeliveryTime: 'Tiempo estimado de entrega',
      isFromWhatsApp: 'Origen WhatsApp',
    };
    return labels[field] || field;
  }

  private getDeliveryFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      recipientName: 'Nombre del destinatario',
      recipientPhone: 'Teléfono del destinatario',
      fullAddress: 'Dirección completa',
      references: 'Referencias',
      coordinates: 'Coordenadas',
    };
    return labels[field] || field;
  }

  private getFieldFormatter(field: string): (value: any) => string {
    const formatters: Record<string, (value: any) => string> = {
      orderStatus: (value) => this.formatOrderStatus(value),
      orderType: (value) => this.formatOrderType(value),
      scheduledAt: (value) =>
        value ? new Date(value).toLocaleString('es-MX') : 'No programada',
      estimatedDeliveryTime: (value) =>
        value ? new Date(value).toLocaleString('es-MX') : 'No especificado',
      isFromWhatsApp: (value) => (value ? 'Sí' : 'No'),
    };
    return (
      formatters[field] || ((value) => value?.toString() || 'No especificado')
    );
  }

  private formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      READY: 'Lista',
      DELIVERED: 'Entregada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return statusMap[status] || status;
  }

  private formatOrderType(type: string): string {
    const typeMap: Record<string, string> = {
      DINE_IN: 'Para Comer Aquí',
      TAKE_AWAY: 'Para Llevar',
      DELIVERY: 'Domicilio',
    };
    return typeMap[type] || type;
  }
}
