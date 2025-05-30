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
      } catch (error) {
        // Manejar el caso donde UsersService podría fallar o no encontrar usuarios
        console.error('Error fetching users for history enrichment:', error);
        // Continuar sin enriquecimiento de usuario o manejar como se prefiera
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
      return enrichedLog;
    });

    return [enrichedLogs, totalCount];
  }
}
