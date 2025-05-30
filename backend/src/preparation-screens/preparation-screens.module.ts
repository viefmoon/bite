import { Module } from '@nestjs/common';
import { PreparationScreensController } from './preparation-screens.controller';
import { PreparationScreensService } from './preparation-screens.service';
import { RelationalPreparationScreenPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPreparationScreenPersistenceModule],
  controllers: [PreparationScreensController],
  providers: [PreparationScreensService],
  exports: [PreparationScreensService],
})
export class PreparationScreensModule {}
