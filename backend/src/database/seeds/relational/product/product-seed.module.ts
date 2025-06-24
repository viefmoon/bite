import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { SubcategoryEntity } from '../../../../subcategories/infrastructure/persistence/relational/entities/subcategory.entity';
import { ProductEntity } from '../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { ProductVariantEntity } from '../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { ModifierGroupEntity } from '../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';
import { ProductModifierEntity } from '../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';
import { PizzaCustomizationEntity } from '../../../../pizza-customizations/infrastructure/persistence/relational/entities/pizza-customization.entity';
import { PizzaConfigurationEntity } from '../../../../pizza-configurations/infrastructure/persistence/relational/entities/pizza-configuration.entity';
import { ProductSeedService } from './product-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      SubcategoryEntity,
      ProductEntity,
      ProductVariantEntity,
      ModifierGroupEntity,
      ProductModifierEntity,
      PizzaCustomizationEntity,
      PizzaConfigurationEntity,
    ]),
  ],
  providers: [ProductSeedService],
  exports: [ProductSeedService],
})
export class ProductSeedModule {}
