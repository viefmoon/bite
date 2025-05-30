import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentMapper } from './mappers/payment.mapper';
import { RelationalPaymentRepository } from './repositories/payment.repository';
import { PAYMENT_REPOSITORY } from '../../../../common/tokens';
import { RelationalOrderPersistenceModule } from '../../../../orders/infrastructure/persistence/relational/relational-persistence.module'; // Importar el módulo de Orders

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity]), 
  forwardRef(() => RelationalOrderPersistenceModule)],
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: RelationalPaymentRepository,
    },
    PaymentMapper,
  ],
  exports: [PAYMENT_REPOSITORY, PaymentMapper],
})
export class RelationalPaymentPersistenceModule {}
