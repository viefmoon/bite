import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { RelationalTablePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AreasModule } from '../areas/areas.module';
import { AuthModule } from '../auth/auth.module';

const infrastructurePersistenceModule = RelationalTablePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AreasModule, AuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService, infrastructurePersistenceModule],
})
export class TablesModule {}
