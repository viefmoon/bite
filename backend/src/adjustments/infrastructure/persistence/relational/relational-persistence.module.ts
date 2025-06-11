import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ADJUSTMENT_REPOSITORY } from '../../../../common/tokens';
import { AdjustmentEntity } from './entities/adjustment.entity';
import { AdjustmentMapper } from './mappers/adjustment.mapper';
import { AdjustmentRelationalRepository } from './repositories/adjustment.repository';
import { OrdersRelationalPersistenceModule } from '../../../../orders/infrastructure/persistence/relational/relational-persistence.module';
import { UsersRelationalPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdjustmentEntity]),
    forwardRef(() => OrdersRelationalPersistenceModule),
    forwardRef(() => UsersRelationalPersistenceModule),
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
