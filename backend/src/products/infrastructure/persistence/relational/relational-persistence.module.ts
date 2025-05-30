import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductRelationalRepository } from './repositories/product.repository';
import { ModifierGroupEntity } from '../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';
import { ProductMapper } from './mappers/product.mapper';
import { PRODUCT_REPOSITORY } from '../../../../common/tokens';
import { RelationalSubcategoryPersistenceModule } from '../../../../subcategories/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalFilePersistenceModule } from '../../../../files/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductVariantPersistenceModule } from '../../../../product-variants/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalModifierGroupPersistenceModule } from '../../../../modifier-groups/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalPreparationScreenPersistenceModule } from '../../../../preparation-screens/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ModifierGroupEntity]),
    forwardRef(() => RelationalSubcategoryPersistenceModule),
    RelationalFilePersistenceModule,
    forwardRef(() => RelationalProductVariantPersistenceModule),
    forwardRef(() => RelationalModifierGroupPersistenceModule),
    forwardRef(() => RelationalPreparationScreenPersistenceModule),
  ],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRelationalRepository,
    },
    ProductMapper,
  ],
  exports: [PRODUCT_REPOSITORY, ProductMapper],
})
export class RelationalProductPersistenceModule {}
