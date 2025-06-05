import { Module } from '@nestjs/common';
import { SessionRelationalRepository } from './repositories/session.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities/session.entity';
import { SESSION_REPOSITORY } from '../../../../common/tokens';
import { SessionMapper } from './mappers/session.mapper';
import { RelationalUserPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    RelationalUserPersistenceModule,
  ],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionRelationalRepository,
    },
    SessionMapper,
  ],
  exports: [SESSION_REPOSITORY], // Exportar solo el token
})
export class RelationalSessionPersistenceModule {}
