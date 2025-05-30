import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ProductVariantRelationalRepository } from './repositories/product-variant.repository';
import { ProductVariantMapper } from './mappers/product-variant.mapper';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';
import { PRODUCT_VARIANT_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariantEntity]),
    forwardRef(() => RelationalProductPersistenceModule),
  ],
  providers: [
    {
      provide: PRODUCT_VARIANT_REPOSITORY,
      useClass: ProductVariantRelationalRepository,
    },
    ProductVariantMapper,
  ],
  exports: [PRODUCT_VARIANT_REPOSITORY, ProductVariantMapper],
})
export class RelationalProductVariantPersistenceModule {}
