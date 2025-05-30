import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableEntity } from './entities/table.entity';
import { TablesRelationalRepository } from './repositories/table.repository';
import { TableMapper } from './mappers/table.mapper';
import { RelationalAreaPersistenceModule } from '../../../../areas/infrastructure/persistence/relational/relational-persistence.module';
import { TABLE_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableEntity]),
    RelationalAreaPersistenceModule,
  ],
  providers: [
    {
      provide: TABLE_REPOSITORY,
      useClass: TablesRelationalRepository,
    },
    TableMapper,
  ],
  exports: [TABLE_REPOSITORY, TableMapper],
})
export class RelationalTablePersistenceModule {}
