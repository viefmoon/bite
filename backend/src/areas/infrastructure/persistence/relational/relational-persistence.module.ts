import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AREA_REPOSITORY } from '../../../../common/tokens';
import { AreaEntity } from './entities/area.entity';
import { AreasRelationalRepository } from './repositories/area.repository';
import { AreaMapper } from './mappers/area.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity])],
  providers: [
    {
      provide: AREA_REPOSITORY,
      useClass: AreasRelationalRepository,
    },
    AreaMapper,
  ],
  exports: [AREA_REPOSITORY, AreaMapper],
})
export class RelationalAreaPersistenceModule {}
