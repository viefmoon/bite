import { Module } from '@nestjs/common';
import { PizzaConfigurationsService } from './pizza-configurations.service';
import { PizzaConfigurationsController } from './pizza-configurations.controller';
import { RelationalPizzaConfigurationPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPizzaConfigurationPersistenceModule],
  controllers: [PizzaConfigurationsController],
  providers: [PizzaConfigurationsService],
  exports: [
    PizzaConfigurationsService,
    RelationalPizzaConfigurationPersistenceModule,
  ],
})
export class PizzaConfigurationsModule {}
