import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { RelationalAreaPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RelationalAreaPersistenceModule, AuthModule],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService, RelationalAreaPersistenceModule],
})
export class AreasModule {}
