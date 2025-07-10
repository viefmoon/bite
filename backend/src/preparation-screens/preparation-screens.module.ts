import { Module } from '@nestjs/common';
import { PreparationScreensController } from './preparation-screens.controller';
import { PreparationScreensService } from './preparation-screens.service';
import { RelationalPreparationScreenPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../products/infrastructure/persistence/relational/relational-persistence.module';
import { CategoriesRelationalPersistenceModule } from '../categories/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalSubcategoryPersistenceModule } from '../subcategories/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalUserPersistenceModule } from '../users/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalPreparationScreenPersistenceModule,
    RelationalProductPersistenceModule,
    CategoriesRelationalPersistenceModule,
    RelationalSubcategoryPersistenceModule,
    RelationalUserPersistenceModule,
  ],
  controllers: [PreparationScreensController],
  providers: [PreparationScreensService],
  exports: [
    PreparationScreensService,
    RelationalPreparationScreenPersistenceModule,
  ],
})
export class PreparationScreensModule {}
