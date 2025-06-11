import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ADJUSTMENT_REPOSITORY } from '../../../../common/tokens';
import { AdjustmentEntity } from './entities/adjustment.entity';
import { AdjustmentMapper } from './mappers/adjustment.mapper';
import { AdjustmentRelationalRepository } from './repositories/adjustment.repository';
import { RelationalOrderPersistenceModule } from '../../../../orders/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalUserPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdjustmentEntity]),
    forwardRef(() => RelationalOrderPersistenceModule),
    forwardRef(() => RelationalUserPersistenceModule),
  ],
  providers: [
    {
      provide: ADJUSTMENT_REPOSITORY,
      useClass: AdjustmentRelationalRepository,
    },
    AdjustmentMapper,
  ],
  exports: [ADJUSTMENT_REPOSITORY, AdjustmentMapper],
})
export class AdjustmentsRelationalPersistenceModule {}
