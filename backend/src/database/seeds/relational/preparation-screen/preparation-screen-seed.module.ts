import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreparationScreenSeedService } from './preparation-screen-seed.service';
import { PreparationScreenEntity } from '../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PreparationScreenEntity, UserEntity])],
  providers: [PreparationScreenSeedService],
  exports: [PreparationScreenSeedService],
})
export class PreparationScreenSeedModule {}
