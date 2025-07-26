import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { RelationalCustomerPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AuthModule } from '../auth/auth.module';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';

const infrastructurePersistenceModule = RelationalCustomerPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AuthModule],
  controllers: [CustomersController, AddressesController],
  providers: [CustomersService, AddressesService],
  exports: [
    CustomersService,
    AddressesService,
    infrastructurePersistenceModule,
  ],
})
export class CustomersModule {}
