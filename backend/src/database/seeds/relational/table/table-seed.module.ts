import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableSeedService } from './table-seed.service';
import { TableEntity } from '../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { AreaEntity } from '../../../../areas/infrastructure/persistence/relational/entities/area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TableEntity, AreaEntity])],
  providers: [TableSeedService],
  exports: [TableSeedService],
})
export class TableSeedModule {}
