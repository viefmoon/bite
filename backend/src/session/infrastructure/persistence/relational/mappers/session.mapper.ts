import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Session } from '../../../../domain/session';
import { SessionEntity } from '../entities/session.entity';

export class SessionMapper extends BaseMapper<SessionEntity, Session> {
  constructor(
    private readonly userMapper: UserMapper,
  ) {
    super();
  }

  override toDomain(raw: SessionEntity): Session {
    const domain = new Session();
    domain.id = raw.id;
    domain.user = this.userMapper.toDomain(raw.user!)!;
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
    entity.id = Number(domain.id);
    entity.hash = domain.hash;
    entity.user = user;

    return entity;
  }
}
