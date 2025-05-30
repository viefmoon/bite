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
  // Añadir AddressesController a los controllers
  controllers: [CustomersController, AddressesController],
  // Añadir AddressesService a los providers
  providers: [CustomersService, AddressesService],
  // Exportar AddressesService si se va a usar fuera de este módulo
  exports: [CustomersService, AddressesService, infrastructurePersistenceModule],
})
export class CustomersModule {}
