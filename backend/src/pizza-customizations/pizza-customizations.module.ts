import { Module } from '@nestjs/common';
import { PizzaCustomizationsService } from './pizza-customizations.service';
import { PizzaCustomizationsController } from './pizza-customizations.controller';
import { RelationalPizzaCustomizationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CustomIdService } from '../common/services/custom-id.service';

@Module({
  imports: [RelationalPizzaCustomizationPersistenceModule],
  controllers: [PizzaCustomizationsController],
  providers: [PizzaCustomizationsService, CustomIdService],
  exports: [
    PizzaCustomizationsService,
    RelationalPizzaCustomizationPersistenceModule,
  ],
})
export class PizzaCustomizationsModule {}
