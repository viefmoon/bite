import { Module } from '@nestjs/common';
import { SessionRepository } from '../session.repository';
import { SessionRelationalRepository } from './repositories/session.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities/session.entity';
import { SESSION_REPOSITORY } from '../../../../common/tokens';
import { SessionMapper } from './mappers/session.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
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
