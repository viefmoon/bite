import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RelationalProductPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { ModifierGroupsModule } from '../modifier-groups/modifier-groups.module';
import { RelationalPreparationScreenPersistenceModule } from '../preparation-screens/infrastructure/persistence/relational/relational-persistence.module'; // Importar el módulo faltante
import { RelationalPizzaIngredientPersistenceModule } from '../pizza-ingredients/infrastructure/persistence/relational/relational-persistence.module';
@Module({
  imports: [
    RelationalProductPersistenceModule,
    ProductVariantsModule,
    ModifierGroupsModule,
    RelationalPreparationScreenPersistenceModule,
    RelationalPizzaIngredientPersistenceModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
