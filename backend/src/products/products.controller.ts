import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { ManagePizzaIngredientsDto } from './dto/manage-pizza-ingredients.dto';
import { BulkUpdatePizzaIngredientsDto } from './dto/bulk-update-pizza-ingredients.dto';
// AssignModifierGroupsDto ya no se usa directamente en endpoints separados

@ApiTags('Productos')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() findAllProductsDto: FindAllProductsDto) {
    return this.productsService.findAll(findAllProductsDto);
  }

  @Get('pizzas/all')
  @ApiOperation({
    summary: 'Obtener todos los productos tipo pizza',
  })
  @HttpCode(HttpStatus.OK)
  findAllPizzas() {
    return this.productsService.findAllPizzas();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un producto por ID',
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put('pizzas/ingredients/bulk')
  @ApiOperation({
    summary: 'Actualizar ingredientes de múltiples pizzas en masa',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  bulkUpdatePizzaIngredients(@Body() data: BulkUpdatePizzaIngredientsDto) {
    return this.productsService.bulkUpdatePizzaIngredients(data.updates);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get(':id/pizza-ingredients')
  @ApiOperation({
    summary: 'Obtener los pizza ingredients de un producto',
  })
  @HttpCode(HttpStatus.OK)
  getPizzaIngredients(@Param('id') id: string) {
    return this.productsService.getPizzaIngredients(id);
  }

  @Put(':id/pizza-ingredients')
  @ApiOperation({
    summary: 'Actualizar los pizza ingredients de un producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  updatePizzaIngredients(
    @Param('id') id: string,
    @Body() managePizzaIngredientsDto: ManagePizzaIngredientsDto,
  ) {
    return this.productsService.updatePizzaIngredients(
      id,
      managePizzaIngredientsDto.pizzaIngredientIds,
    );
  }
  // Los endpoints específicos para modifier-groups se eliminan.
  // La asignación/actualización se maneja en POST /products y PATCH /products/:id.
  // La obtención se maneja en GET /products/:id (cargando la relación).
}
