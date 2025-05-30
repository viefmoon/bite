import { Controller } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Area } from './domain/area';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAllAreasDto } from './dto/find-all-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { CrudControllerFactory } from '../common/presentation/crud-controller.factory'; 

const BaseAreasController = CrudControllerFactory<
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  FindAllAreasDto,
  AreasService
>({
  path: 'areas', // Ruta base
  swaggerTag: 'Areas', // Etiqueta para Swagger
  // Especificar roles si son diferentes a los defaults (admin para CUD)
  // createRoles: [RoleEnum.admin],
  // updateRoles: [RoleEnum.admin],
  // removeRoles: [RoleEnum.admin],
  // findAll y findOne suelen ser públicos por defecto en la factory
});

@Controller() 
export class AreasController extends BaseAreasController {
}

