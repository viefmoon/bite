import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [CategoriesRelationalPersistenceModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
