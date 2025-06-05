import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { SessionRepository } from '../../session.repository';
import { Session } from '../../../../domain/session';
import { SessionMapper } from '../mappers/session.mapper';
import { User } from '../../../../../users/domain/user';

@Injectable()
export class SessionRelationalRepository implements SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly sessionMapper: SessionMapper,
  ) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    if (!id || id === null || id === undefined) {
      return null;
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      return null;
    }

    const entity = await this.sessionRepository.findOne({
      where: {
        id: numericId,
      },
    });

    return entity ? this.sessionMapper.toDomain(entity) : null;
  }

  async create(data: Session): Promise<Session> {
    const persistenceModel = this.sessionMapper.toEntity(data);
    const createdEntity = await this.sessionRepository.save(
      this.sessionRepository.create(persistenceModel),
    );

    // Cargar la entidad con sus relaciones
    const entityWithRelations = await this.sessionRepository.findOne({
      where: { id: createdEntity.id },
      relations: ['user', 'user.role'],
    });

    if (!entityWithRelations) {
      throw new Error('Failed to create session');
    }

    return this.sessionMapper.toDomain(entityWithRelations);
  }

  async update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    if (!id || id === null || id === undefined) {
      throw new Error('Session ID is required');
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new Error('Invalid session ID');
    }

    const entity = await this.sessionRepository.findOne({
      where: { id: numericId },
    });

    if (!entity) {
      throw new Error('Session not found');
    }

    const updatedEntity = await this.sessionRepository.save(
      this.sessionRepository.create(
        this.sessionMapper.toEntity({
          ...this.sessionMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return this.sessionMapper.toDomain(updatedEntity);
  }

  async deleteById(id: Session['id']): Promise<void> {
    if (!id || id === null || id === undefined) {
      return;
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      return;
    }

    await this.sessionRepository.softDelete({
      id: numericId,
    });
  }

  async deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    await this.sessionRepository.softDelete({
      user: {
        id: conditions.userId, // ID es string (UUID)
      },
    });
  }

  async deleteByUserIdWithExclude(conditions: {
    userId: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    if (
      !conditions.excludeSessionId ||
      conditions.excludeSessionId === null ||
      conditions.excludeSessionId === undefined
    ) {
      // Si no hay session a excluir, simplemente eliminamos todas las sesiones del usuario
      return this.deleteByUserId({ userId: conditions.userId });
    }

    const numericExcludeId = Number(conditions.excludeSessionId);
    if (isNaN(numericExcludeId)) {
      // Si el ID es inválido, eliminamos todas las sesiones del usuario
      return this.deleteByUserId({ userId: conditions.userId });
    }

    await this.sessionRepository.softDelete({
      user: {
        id: conditions.userId, // ID es string (UUID)
      },
      id: Not(numericExcludeId),
    });
  }
}
