import { Module } from '@nestjs/common';
import { PizzaConfigurationsService } from './pizza-configurations.service';
import { RelationalPizzaConfigurationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPizzaConfigurationPersistenceModule],
  providers: [PizzaConfigurationsService],
  exports: [PizzaConfigurationsService, RelationalPizzaConfigurationPersistenceModule],
})
export class PizzaConfigurationsModule {}