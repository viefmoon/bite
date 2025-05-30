import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModifierEntity } from './entities/product-modifier.entity';
import { ProductModifierMapper } from './mappers/product-modifier.mapper';
import { ProductModifierRepository } from '../product-modifier.repository';
import { PRODUCT_MODIFIER_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ProductModifierEntity])],
  providers: [
    {
      provide: PRODUCT_MODIFIER_REPOSITORY,
      useClass: ProductModifierRepository,
    },
    ProductModifierMapper,
  ],
  exports: [PRODUCT_MODIFIER_REPOSITORY, ProductModifierMapper],
})
export class RelationalProductModifierPersistenceModule {}
