import { Module } from '@nestjs/common';
import { PizzaIngredientsService } from './pizza-ingredients.service';
import { PizzaIngredientsController } from './pizza-ingredients.controller';
import { RelationalPizzaIngredientPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPizzaIngredientPersistenceModule],
  controllers: [PizzaIngredientsController],
  providers: [PizzaIngredientsService],
  exports: [PizzaIngredientsService],
})
export class PizzaIngredientsModule {}
