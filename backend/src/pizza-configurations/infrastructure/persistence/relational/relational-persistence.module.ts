import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PizzaConfigurationEntity } from './entities/pizza-configuration.entity';
import { PizzaConfigurationRepository } from '../pizza-configuration.repository';
import { PizzaConfigurationRelationalRepository } from './repositories/pizza-configuration.repository';
import { PizzaConfigurationMapper } from './mappers/pizza-configuration.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaConfigurationEntity])],
  providers: [
    {
      provide: PizzaConfigurationRepository,
      useClass: PizzaConfigurationRelationalRepository,
    },
    PizzaConfigurationMapper,
  ],
  exports: [PizzaConfigurationRepository, PizzaConfigurationMapper],
})
export class RelationalPizzaConfigurationPersistenceModule {}
