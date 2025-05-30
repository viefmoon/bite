import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { AddressEntity } from './entities/address.entity';
import { CustomerRelationalRepository } from './repositories/customer.repository';
import { AddressRelationalRepository } from './repositories/address.repository';
import { CustomerMapper } from './mappers/customer.mapper';
import { AddressMapper } from './mappers/address.mapper';
import { CUSTOMER_REPOSITORY } from '../../../../common/tokens';
import { ADDRESS_REPOSITORY } from '../../../../common/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, AddressEntity])],
  providers: [
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: CustomerRelationalRepository,
    },
    {
      provide: ADDRESS_REPOSITORY,
      useClass: AddressRelationalRepository,
    },
    CustomerMapper,
    AddressMapper,
  ],
  exports: [
    CUSTOMER_REPOSITORY,
    ADDRESS_REPOSITORY,
    CustomerMapper,
    AddressMapper,
  ],
})
export class RelationalCustomerPersistenceModule {}
