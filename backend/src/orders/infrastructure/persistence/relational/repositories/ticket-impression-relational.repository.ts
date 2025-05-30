import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'; // Añadir excepciones
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { TicketImpression } from '../../../../domain/ticket-impression';
import { TicketImpressionRepository } from '../../ticket-impression.repository';
import { TicketImpressionEntity } from '../entities/ticket-impression.entity';
import { TicketImpressionMapper } from '../mappers/ticket-impression.mapper';
import { TicketType } from '../../../../domain/enums/ticket-type.enum'; // Importar TicketType

@Injectable()
export class TicketImpressionRelationalRepository
  implements TicketImpressionRepository
{
  constructor(
    @InjectRepository(TicketImpressionEntity)
    private readonly repository: Repository<TicketImpressionEntity>,
    private readonly ticketImpressionMapper: TicketImpressionMapper, // Inyectar el mapper
  ) {}

  async create(
    data: Omit<
      TicketImpression,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'order' | 'user'
    >,
  ): Promise<TicketImpression> {
    const persistenceModel = this.ticketImpressionMapper.toEntity( // Usar instancia del mapper
      data as TicketImpression,
    );
    if (!persistenceModel) {
      throw new InternalServerErrorException('Error creating ticket impression entity');
    }
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    // Recargar para obtener relaciones
    const completeEntity = await this.repository.findOne({
      where: { id: newEntity.id },
      relations: ['order', 'user'],
    });
    if (!completeEntity) {
      // Usar NotFoundException o InternalServerErrorException según el caso
      throw new InternalServerErrorException('Failed to load created ticket impression after saving');
    }
    const domainResult = this.ticketImpressionMapper.toDomain(completeEntity); // Usar instancia del mapper
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping saved ticket impression entity to domain');
    }
    return domainResult;
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: {
      orderId?: string;
      userId?: string;
      ticketType?: string;
    } | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TicketImpression[]> {
    const where: FindOptionsWhere<TicketImpressionEntity> = {};

    if (filterOptions?.orderId) {
      where.orderId = filterOptions.orderId;
    }
    if (filterOptions?.userId) {
      where.userId = filterOptions.userId;
    }
    if (filterOptions?.ticketType) {
      where.ticketType = filterOptions.ticketType as TicketType; // Castear a TicketType
    }

    const entities = await this.repository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      relations: ['order', 'user'],
      order: {
        impressionTime: 'DESC', // Ordenar por fecha de impresión descendente
      },
    });

    // Mapear y filtrar nulos
    return entities
      .map((entity) => this.ticketImpressionMapper.toDomain(entity)) // Usar instancia del mapper
      .filter((item): item is TicketImpression => item !== null);
  }

  async findById(
    id: TicketImpression['id'],
  ): Promise<NullableType<TicketImpression>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['order', 'user'],
    });

    const domainResult = entity ? this.ticketImpressionMapper.toDomain(entity) : null; // Usar instancia del mapper
    // Opcional: Lanzar NotFoundException si no se encuentra, similar a categorías
    // if (!domainResult) {
    //   throw new NotFoundException(`TicketImpression with ID ${id} not found`);
    // }
    return domainResult;
  }

  async findByOrderId(
    orderId: TicketImpression['orderId'],
  ): Promise<TicketImpression[]> {
    const entities = await this.repository.find({
      where: { orderId },
      relations: ['order', 'user'],
      order: {
        impressionTime: 'DESC',
      },
    });

    // Mapear y filtrar nulos
    return entities
      .map((entity) => this.ticketImpressionMapper.toDomain(entity)) // Usar instancia del mapper
      .filter((item): item is TicketImpression => item !== null);
  }
}
