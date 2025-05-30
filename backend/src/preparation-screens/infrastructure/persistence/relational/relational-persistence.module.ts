import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreparationScreenEntity } from './entities/preparation-screen.entity';
import { PreparationScreensRelationalRepository } from './repositories/preparation-screen.repository';
import { PREPARATION_SCREEN_REPOSITORY } from '../../../../common/tokens';
import { PreparationScreenMapper } from './mappers/preparation-screen.mapper';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreparationScreenEntity]),
    forwardRef(() => RelationalProductPersistenceModule),
  ],
  providers: [
    {
      provide: PREPARATION_SCREEN_REPOSITORY,
      useClass: PreparationScreensRelationalRepository,
    },
    PreparationScreenMapper,
  ],
  exports: [PREPARATION_SCREEN_REPOSITORY, PreparationScreenMapper],
})
export class RelationalPreparationScreenPersistenceModule {}
