import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PizzaCustomizationEntity } from './entities/pizza-customization.entity';
import { PizzaCustomizationRepository } from '../pizza-customization.repository';
import { PizzaCustomizationRelationalRepository } from './repositories/pizza-customization.repository';
import { PizzaCustomizationMapper } from './mappers/pizza-customization.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaCustomizationEntity])],
  providers: [
    {
      provide: PizzaCustomizationRepository,
      useClass: PizzaCustomizationRelationalRepository,
    },
    PizzaCustomizationMapper,
  ],
  exports: [PizzaCustomizationRepository, PizzaCustomizationMapper],
})
export class RelationalPizzaCustomizationPersistenceModule {}