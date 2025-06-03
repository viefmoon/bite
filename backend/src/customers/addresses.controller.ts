import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CrudControllerFactory } from '../common/presentation/crud-controller.factory';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAllAddressesDto } from './dto/find-all-addresses.dto';
import { AddressesService } from './addresses.service';
import { RoleEnum } from '../roles/roles.enum';

// Crear el controlador base usando la factory para la ruta plana /addresses
const BaseAddressesController = CrudControllerFactory<
  Address,
  CreateAddressDto,
  UpdateAddressDto,
  FindAllAddressesDto,
  AddressesService
>({
  path: 'addresses', // Ruta base plana
  swaggerTag: 'Addresses', // Etiqueta para Swagger
  // Mantener roles por defecto (Admin para CUD) o ajustar si es necesario
  // createRoles: [RoleEnum.admin, RoleEnum.user], // Ejemplo si usuarios pudieran crear
});

@ApiTags('Addresses') // Etiqueta Swagger
@Controller() // El path 'addresses' ya está definido en la factory
export class AddressesController extends BaseAddressesController {
  constructor(protected readonly service: AddressesService) {
    super(service);
  }
}
