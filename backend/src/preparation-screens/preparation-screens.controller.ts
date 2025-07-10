import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PreparationScreensService } from './preparation-screens.service';
import { CreatePreparationScreenDto } from './dto/create-preparation-screen.dto';
import { UpdatePreparationScreenDto } from './dto/update-preparation-screen.dto';
import { FindAllPreparationScreensDto } from './dto/find-all-preparation-screens.dto';
import { AssociateProductsDto } from './dto/associate-products.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Pantallas de Preparación')
@Controller({
  path: 'preparation-screens',
  version: '1',
})
export class PreparationScreensController {
  constructor(
    private readonly preparationScreensService: PreparationScreensService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPreparationScreenDto: CreatePreparationScreenDto) {
    return this.preparationScreensService.create(createPreparationScreenDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las pantallas de preparación',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() findAllPreparationScreensDto: FindAllPreparationScreensDto) {
    return this.preparationScreensService.findAll(findAllPreparationScreensDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una pantalla de preparación por ID',
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.preparationScreensService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updatePreparationScreenDto: UpdatePreparationScreenDto,
  ) {
    return this.preparationScreensService.update(
      id,
      updatePreparationScreenDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.preparationScreensService.remove(id);
  }

  @Get(':id/products')
  @ApiOperation({
    summary: 'Obtener productos asociados a una pantalla de preparación',
  })
  @HttpCode(HttpStatus.OK)
  async getProducts(@Param('id') id: string) {
    return this.preparationScreensService.getProducts(id);
  }

  @Get(':id/menu-with-associations')
  @ApiOperation({
    summary:
      'Obtener menú completo con información de asociaciones para una pantalla específica',
  })
  @HttpCode(HttpStatus.OK)
  async getMenuWithAssociations(@Param('id') id: string) {
    return this.preparationScreensService.getMenuWithAssociations(id);
  }

  @Post(':id/products')
  @ApiOperation({
    summary: 'Asociar productos a una pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async associateProducts(
    @Param('id') id: string,
    @Body() associateProductsDto: AssociateProductsDto,
  ) {
    return this.preparationScreensService.associateProducts(
      id,
      associateProductsDto.productIds,
    );
  }

  @Get(':id/users')
  @ApiOperation({
    summary: 'Obtener usuarios asignados a una pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async getUsers(@Param('id') id: string) {
    return this.preparationScreensService.getUsers(id);
  }

  @Post(':id/users')
  @ApiOperation({
    summary: 'Asignar usuarios a una pantalla de preparación',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersDto,
  ) {
    return this.preparationScreensService.assignUsers(id, assignUsersDto.users);
  }
}
