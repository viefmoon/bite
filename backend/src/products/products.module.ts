import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RelationalProductPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { ModifierGroupsModule } from '../modifier-groups/modifier-groups.module';
import { RelationalPreparationScreenPersistenceModule } from '../preparation-screens/infrastructure/persistence/relational/relational-persistence.module';
import { PizzaCustomizationsModule } from '../pizza-customizations/pizza-customizations.module';
import { PizzaConfigurationsModule } from '../pizza-configurations/pizza-configurations.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [
    RelationalProductPersistenceModule,
    ProductVariantsModule,
    ModifierGroupsModule,
    RelationalPreparationScreenPersistenceModule,
    PizzaCustomizationsModule,
    PizzaConfigurationsModule,
    CommonModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
