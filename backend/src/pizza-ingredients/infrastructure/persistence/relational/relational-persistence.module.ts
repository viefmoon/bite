import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PizzaIngredientEntity } from './entities/pizza-ingredient.entity';
import { PizzaIngredientRepository } from '../pizza-ingredient.repository';
import { PizzaIngredientRelationalRepository } from './repositories/pizza-ingredient.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaIngredientEntity])],
  providers: [
    {
      provide: PizzaIngredientRepository,
      useClass: PizzaIngredientRelationalRepository,
    },
  ],
  exports: [PizzaIngredientRepository],
})
export class RelationalPizzaIngredientPersistenceModule {}
