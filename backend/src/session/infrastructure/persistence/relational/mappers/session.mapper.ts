import { Injectable } from '@nestjs/common';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Session } from '../../../../domain/session';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class SessionMapper extends BaseMapper<SessionEntity, Session> {
  constructor(private readonly userMapper: UserMapper) {
    super();
  }

  override toDomain(raw: SessionEntity): Session {
    const domain = new Session();
    domain.id = raw.id;
    
    if (!raw.user) {
      throw new Error('Session must have a user');
    }
    
    const user = this.userMapper.toDomain(raw.user);
    if (!user) {
      throw new Error('Failed to map user');
    }
    
    domain.user = user;
    domain.hash = raw.hash;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  override toEntity(domain: Session): SessionEntity {
    const user = new UserEntity();
    user.id = domain.user.id;

    const entity = new SessionEntity();
    // Solo asignar id si existe y es válido
    if (domain.id !== null && domain.id !== undefined) {
      const numericId = Number(domain.id);
      if (!isNaN(numericId)) {
        entity.id = numericId;
      }
    }
    entity.hash = domain.hash;
    entity.user = user;

    return entity;
  }
}
