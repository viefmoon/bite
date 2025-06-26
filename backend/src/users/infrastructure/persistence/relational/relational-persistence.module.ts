import { Module } from '@nestjs/common';
import { UsersRelationalRepository } from './repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { USER_REPOSITORY } from '../../../../common/tokens';
import { PreparationScreenEntity } from '../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, PreparationScreenEntity])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UsersRelationalRepository,
    },
    UserMapper,
  ],
  exports: [USER_REPOSITORY, UserMapper],
})
export class RelationalUserPersistenceModule {}
