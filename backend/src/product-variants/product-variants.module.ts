import { Module } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { ProductVariantsController } from './product-variants.controller';
import { RelationalProductVariantPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RelationalProductVariantPersistenceModule, CommonModule],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService, RelationalProductVariantPersistenceModule], // Export persistence module
})
export class ProductVariantsModule {}
