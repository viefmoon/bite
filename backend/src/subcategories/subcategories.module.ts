import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';
import { RelationalSubcategoryPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RelationalSubcategoryPersistenceModule, CommonModule],
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],
  exports: [SubcategoriesService],
})
export class SubcategoriesModule {}
