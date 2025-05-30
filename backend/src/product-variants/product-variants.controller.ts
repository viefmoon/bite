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
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { FindAllProductVariantsDto } from './dto/find-all-product-variants.dto';

@ApiTags('Variantes de Productos')
@Controller({
  path: 'product-variants',
  version: '1',
})
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva variante de producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantsService.create(createProductVariantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las variantes de productos',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() findAllProductVariantsDto: FindAllProductVariantsDto) {
    return this.productVariantsService.findAll(findAllProductVariantsDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una variante de producto por ID',
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una variante de producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(id, updateProductVariantDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una variante de producto',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(id);
  }
}
