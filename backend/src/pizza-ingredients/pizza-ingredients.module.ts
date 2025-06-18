import { Module } from '@nestjs/common';
import { PizzaIngredientsService } from './pizza-ingredients.service';
import { PizzaIngredientsController } from './pizza-ingredients.controller';
import { RelationalPizzaIngredientPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RelationalPizzaIngredientPersistenceModule, CommonModule],
  controllers: [PizzaIngredientsController],
  providers: [PizzaIngredientsService],
  exports: [PizzaIngredientsService],
})
export class PizzaIngredientsModule {}
