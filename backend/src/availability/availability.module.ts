import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { CategoriesModule } from '../categories/categories.module';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { ProductsModule } from '../products/products.module';
import { ModifierGroupsModule } from '../modifier-groups/modifier-groups.module';
import { ProductModifiersModule } from '../product-modifiers/product-modifiers.module';
import { PizzaCustomizationsModule } from '../pizza-customizations/pizza-customizations.module';

@Module({
  imports: [
    CategoriesModule,
    SubcategoriesModule,
    ProductsModule,
    ModifierGroupsModule,
    ProductModifiersModule,
    PizzaCustomizationsModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
