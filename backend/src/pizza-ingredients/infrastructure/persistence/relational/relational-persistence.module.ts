import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PizzaIngredientEntity } from './entities/pizza-ingredient.entity';
import { PizzaIngredientRepository } from '../pizza-ingredient.repository';
import { PizzaIngredientRelationalRepository } from './repositories/pizza-ingredient.repository';
import { PIZZA_INGREDIENT_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaIngredientEntity])],
  providers: [
    {
      provide: PIZZA_INGREDIENT_REPOSITORY,
      useClass: PizzaIngredientRelationalRepository,
    },
  ],
  exports: [PIZZA_INGREDIENT_REPOSITORY],
})
export class RelationalPizzaIngredientPersistenceModule {}
