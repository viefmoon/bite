import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  // ParseUUIDPipe, DefaultValuePipe, ParseIntPipe ya no se usan directamente
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
// CreateAddressDto y UpdateAddressDto ya no se usan directamente
import { FindAllCustomersDto } from './dto/find-all-customers.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Customer } from './domain/customer';
// Address ya no se usa directamente
// Imports de InfinityPagination ya no se usan
import { CrudControllerFactory } from '../common/presentation/crud-controller.factory'; // Importar Factory
import { AddressesService } from './addresses.service'; // Importar AddressesService

// Crear el controlador base usando la factory
const BaseCustomersController = CrudControllerFactory<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  FindAllCustomersDto, // Usar FindAllCustomersDto como DTO de filtro base
  CustomersService
>({
  path: 'customers', // Ruta base (la factory añade /:id etc.)
  swaggerTag: 'Customers', // Etiqueta para Swagger
  // Roles por defecto de la factory (Admin para CUD) son adecuados aquí
});

@ApiTags('Customers') // Mantener ApiTags aquí o mover a la factory si se prefiere
@Controller() // El path ya está definido en la factory
export class CustomersController extends BaseCustomersController {
  // Extender el controlador base
  // Inyectar ambos servicios
  constructor(
    protected service: CustomersService, // El servicio principal (requerido por la factory)
    private addressesService: AddressesService, // El servicio de direcciones
  ) {
    super(service); // Llamar al constructor base con el servicio principal
  }

  // Los métodos create, findOne, update, remove son heredados de BaseCustomersController

  // Se elimina el endpoint GET /customers con paginación infinita.
  // El endpoint GET / heredado de BaseCustomersController (sin paginación) tomará efecto si se necesita.

  // --- Endpoints específicos para Direcciones eliminados ---
  // La gestión de direcciones se moverá a un AddressesController plano (/addresses).
}
