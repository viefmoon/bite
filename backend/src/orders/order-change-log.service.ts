// src/orders/order-change-log.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { OrderHistoryRepository } from './infrastructure/persistence/order-history.repository';
import { UsersService } from '../users/users.service'; // Importar UsersService
import { ORDER_HISTORY_REPOSITORY } from '../common/tokens'; // Importar el token
import { IPaginationOptions } from '../utils/types/pagination-options';
import { OrderHistoryEntity } from './infrastructure/persistence/relational/entities/order-history.entity';
import { User } from '../users/domain/user'; // Importar User domain

// DTO para la respuesta enriquecida (opcional, pero bueno para claridad)
export class EnrichedOrderHistoryDto extends OrderHistoryEntity {
  changedByUser?: Pick<
    User,
    'id' | 'firstName' | 'lastName' | 'username'
  > | null; // Datos básicos del usuario
  formattedChanges?: Record<string, any>; // Cambios formateados para mostrar
}

@Injectable()
export class OrderChangeLogService {
  constructor(
    @Inject(ORDER_HISTORY_REPOSITORY) // Usar el token Symbol
    private readonly historyRepository: OrderHistoryRepository,
    private readonly usersService: UsersService, // Inyectar UsersService
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

    // Extraer IDs de usuario únicos, asegurándose de que no sean null o undefined
    const userIds = [...new Set(logs.map((log) => log.changedBy))].filter(
      (id): id is string => !!id, // Filtrar valores nulos/undefined y asegurar que son string
    );

    // Obtener datos de los usuarios solo si hay IDs válidos
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
      } catch {
        // Manejar el caso donde UsersService podría fallar o no encontrar usuarios
        // Continuar sin enriquecimiento de usuario
      }
    }

    // Enriquecer los logs con los datos del usuario
    // Corregir la creación del objeto enriquecido
    const enrichedLogs = logs.map((log) => {
      const user = log.changedBy ? userMap.get(log.changedBy) : null;
      // Crear una instancia de EnrichedOrderHistoryDto
      const enrichedLog = new EnrichedOrderHistoryDto();
      // Copiar las propiedades de la entidad base 'log' a la nueva instancia
      Object.assign(enrichedLog, log);
      // Asignar la propiedad adicional
      enrichedLog.changedByUser = user || null;

      // Formatear los cambios para mostrarlos de manera más clara
      if (log.diff) {
        // Si es el nuevo formato consolidado, pasarlo tal cual para que la app lo maneje
        if (log.diff.order || log.diff.items || log.diff.summary) {
          enrichedLog.diff = log.diff;
          enrichedLog.formattedChanges = this.formatChanges(log.diff);
        } else if (log.operation === 'UPDATE') {
          // Formato legacy
          enrichedLog.formattedChanges = this.formatChanges(log.diff);
        }
      }

      return enrichedLog;
    });

    return [enrichedLogs, totalCount];
  }

  private formatChanges(diff: any): Record<string, any> {
    const formatted: Record<string, any> = {};

    // Nuevo formato consolidado
    if (diff && (diff.order || diff.items || diff.summary)) {
      // Incluir resumen si existe
      if (diff.summary) {
        formatted['Resumen'] = diff.summary;
      }

      // Formatear cambios de la orden
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

      // Formatear cambios en los items
      if (diff.items) {
        formatted['Cambios en productos'] = this.formatConsolidatedItemChanges(
          diff.items,
        );
      }

      return formatted;
    }

    // Formato legacy (compatibilidad hacia atrás)
    return this.formatOrderChanges(diff);
  }

  private formatOrderChanges(diff: any): Record<string, any> {
    const formatted: Record<string, any> = {};

    // Mapeo de nombres de campos a etiquetas en español
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

    // Mapeo de valores para hacerlos más legibles
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
          // Es un cambio simple: [valorAnterior, valorNuevo]
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
