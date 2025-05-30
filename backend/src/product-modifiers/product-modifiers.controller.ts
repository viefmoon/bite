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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductModifiersService } from './product-modifiers.service';
import { CreateProductModifierDto } from './dto/create-product-modifier.dto';
import { UpdateProductModifierDto } from './dto/update-product-modifier.dto';
import { FindAllProductModifiersDto } from './dto/find-all-product-modifiers.dto';
import { ProductModifier } from './domain/product-modifier';
import { Paginated } from '../common/types/paginated.type';

@ApiTags('Product Modifiers')
@Controller({ path: 'product-modifiers', version: '1' })
export class ProductModifiersController {
  constructor(
    private readonly productModifiersService: ProductModifiersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product modifier' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The product modifier has been successfully created.',
    type: ProductModifier,
  })
  create(
    @Body() createProductModifierDto: CreateProductModifierDto,
  ): Promise<ProductModifier> {
    return this.productModifiersService.create(createProductModifierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product modifiers with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return a paginated list of product modifiers',
    // TODO: Define a specific ApiOkResponse decorator with a Paginated<ProductModifier> type/schema for Swagger
    // type: [ProductModifier], // Original incorrect type
  })
  findAll(
    @Query() filterDto: FindAllProductModifiersDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<Paginated<ProductModifier>> {
    return this.productModifiersService.findAll(filterDto, {
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product modifier by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the product modifier with the specified id',
    type: ProductModifier,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product modifier not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductModifier> {
    return this.productModifiersService.findOne(id);
  }

  @Get('by-group/:groupId')
  @ApiOperation({ summary: 'Get all product modifiers by group id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all product modifiers for the specified group id',
    type: [ProductModifier],
  })
  findByGroupId(
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<ProductModifier[]> {
    return this.productModifiersService.findByGroupId(groupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product modifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The product modifier has been successfully updated.',
    type: ProductModifier,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product modifier not found',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductModifierDto: UpdateProductModifierDto,
  ): Promise<ProductModifier> {
    return this.productModifiersService.update(id, updateProductModifierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product modifier' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The product modifier has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product modifier not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productModifiersService.remove(id);
  }
}
