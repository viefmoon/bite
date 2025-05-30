import { Module } from '@nestjs/common';
import { ModifierGroupsController } from './modifier-groups.controller';
import { ModifierGroupsService } from './modifier-groups.service';
import { RelationalModifierGroupPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AuthModule } from '../auth/auth.module';

const infrastructurePersistenceModule =
  RelationalModifierGroupPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AuthModule],
  controllers: [ModifierGroupsController],
  providers: [ModifierGroupsService],
  exports: [ModifierGroupsService, infrastructurePersistenceModule],
})
export class ModifierGroupsModule {}
