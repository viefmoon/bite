import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifierGroupEntity } from './entities/modifier-group.entity';
import { ModifierGroupsRelationalRepository } from './repositories/modifier-group.repository';
import { ModifierGroupMapper } from './mappers/modifier-group.mapper';
import { MODIFIER_GROUP_REPOSITORY } from '../../../../common/tokens';
import { RelationalProductModifierPersistenceModule } from '../../../../product-modifiers/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModifierGroupEntity]),
    RelationalProductModifierPersistenceModule,
    forwardRef(() => RelationalProductPersistenceModule),
  ],
  providers: [
    {
      provide: MODIFIER_GROUP_REPOSITORY,
      useClass: ModifierGroupsRelationalRepository,
    },
    ModifierGroupMapper,
  ],
  exports: [MODIFIER_GROUP_REPOSITORY, ModifierGroupMapper],
})
export class RelationalModifierGroupPersistenceModule {}
