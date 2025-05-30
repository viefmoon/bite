import { Module } from '@nestjs/common';
import { UsersRelationalRepository } from './repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { USER_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
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
