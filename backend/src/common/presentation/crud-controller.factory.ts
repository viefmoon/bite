import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Type, // Importar Type
  HttpCode, HttpStatus, UseGuards // Importar decoradores necesarios
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'; // Importar decoradores de Swagger
import { BaseCrudService } from '../application/base-crud.service';
import { AuthGuard } from '@nestjs/passport'; // Asumiendo AuthGuard para proteger endpoints
import { RolesGuard } from '../../roles/roles.guard'; // Asumiendo RolesGuard
import { Roles } from '../../roles/roles.decorator'; // Asumiendo Roles decorator
import { RoleEnum } from '../../roles/roles.enum'; // Asumiendo RoleEnum

// Definir una interfaz para las opciones de configuración del CRUD Controller
export interface CrudControllerOptions {
  path: string;
  swaggerTag?: string;
  createRoles?: RoleEnum[];
  updateRoles?: RoleEnum[];
  removeRoles?: RoleEnum[];
  // Puedes añadir más opciones como guards específicos por método
}

// Definir una interfaz para el tipo que devuelve la factory
export interface ICrudController<D, CreateDto, UpdateDto, FilterDto> {
  create(dto: CreateDto): Promise<D>;
  findAll(q: FilterDto): Promise<D[]>;
  findOne(id: string): Promise<D>;
  update(id: string, dto: UpdateDto): Promise<D | null>;
  remove(id: string): Promise<void>;
}

export function CrudControllerFactory<
  D extends { id: unknown }, // Añadir constraint a D
  CreateDto,
  UpdateDto,
  FilterDto,
  S extends BaseCrudService<D, CreateDto, UpdateDto, FilterDto>,
>(
  options: CrudControllerOptions // Usar el objeto de opciones
): Type<ICrudController<D, CreateDto, UpdateDto, FilterDto>> { // Devolver Type<ICrudController>

  const {
    path,
    swaggerTag,
    createRoles = [RoleEnum.admin], // Roles por defecto para crear
    updateRoles = [RoleEnum.admin], // Roles por defecto para actualizar
    removeRoles = [RoleEnum.admin], // Roles por defecto para eliminar
  } = options;

  @ApiTags(swaggerTag ?? path)
  @Controller({ path, version: '1' })
  class CrudController implements ICrudController<D, CreateDto, UpdateDto, FilterDto> {
    // Inyectar el servicio genérico. Debe ser proveído en el módulo que use este controller.
    constructor(protected readonly service: S) {}

    @Post()
    @ApiOperation({ summary: `Create a new ${swaggerTag ?? path}` })
    @ApiBearerAuth() 
    @UseGuards(AuthGuard('jwt'), RolesGuard) 
    @Roles(...createRoles) 
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateDto): Promise<D> {
      return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: `Find all ${swaggerTag ?? path}` })
    // findAll suele ser público, pero puedes añadir guards/roles si es necesario
    @HttpCode(HttpStatus.OK)
    findAll(@Query() q: FilterDto): Promise<D[]> {
      return this.service.findAll(q);
    }

    @Get(':id')
    @ApiOperation({ summary: `Find one ${swaggerTag ?? path} by ID` })
    // findOne suele ser público
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id') id: D['id']): Promise<D> { // Usar D['id'] para el tipo del parámetro
      // El servicio ya maneja NotFoundException
      return this.service.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: `Update a ${swaggerTag ?? path}` })
    @ApiBearerAuth() 
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...updateRoles) 
    @HttpCode(HttpStatus.OK)
    update(@Param('id') id: D['id'], @Body() dto: UpdateDto): Promise<D | null> { // Usar D['id']
      return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: `Remove a ${swaggerTag ?? path}` })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(...removeRoles) // Aplicar roles para eliminar
    @HttpCode(HttpStatus.NO_CONTENT) // Usar NO_CONTENT para delete
    async remove(@Param('id') id: D['id']): Promise<void> { // Usar D['id'], método async
      await this.service.remove(id);
    }
  }
  // Devolver la clase del controlador creada dinámicamente
  return CrudController;
}