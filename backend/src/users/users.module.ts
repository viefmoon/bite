import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';

import { UsersService } from './users.service';
import { RelationalUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UserMapper } from './infrastructure/persistence/relational/mappers/user.mapper';

const infrastructurePersistenceModule = RelationalUserPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  exports: [UsersService, infrastructurePersistenceModule],
})
export class UsersModule {}
