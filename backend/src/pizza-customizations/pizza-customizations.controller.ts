import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PizzaCustomizationsService } from './pizza-customizations.service';
import { CreatePizzaCustomizationDto } from './dto/create-pizza-customization.dto';
import { UpdatePizzaCustomizationDto } from './dto/update-pizza-customization.dto';
import { FindAllPizzaCustomizationsDto } from './dto/find-all-pizza-customizations.dto';
import { PizzaCustomization } from './domain/pizza-customization';
import { Paginated } from '../common/types/paginated.type';

@ApiTags('pizza-customizations')
@Controller('pizza-customizations')
export class PizzaCustomizationsController {
  constructor(
    private readonly pizzaCustomizationsService: PizzaCustomizationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pizza customization' })
  @ApiResponse({
    status: 201,
    description: 'The pizza customization has been successfully created.',
  })
  create(
    @Body() createPizzaCustomizationDto: CreatePizzaCustomizationDto,
  ): Promise<PizzaCustomization> {
    return this.pizzaCustomizationsService.create(createPizzaCustomizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pizza customizations' })
  @ApiResponse({
    status: 200,
    description: 'Return all pizza customizations.',
  })
  findAll(
    @Query() query: FindAllPizzaCustomizationsDto,
  ): Promise<Paginated<PizzaCustomization>> {
    return this.pizzaCustomizationsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active pizza customizations' })
  @ApiResponse({
    status: 200,
    description: 'Return all active pizza customizations.',
  })
  findAllActive(): Promise<PizzaCustomization[]> {
    return this.pizzaCustomizationsService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pizza customization by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the pizza customization.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pizza customization not found.',
  })
  findOne(@Param('id') id: string): Promise<PizzaCustomization> {
    return this.pizzaCustomizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pizza customization' })
  @ApiResponse({
    status: 200,
    description: 'The pizza customization has been successfully updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Pizza customization not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePizzaCustomizationDto: UpdatePizzaCustomizationDto,
  ): Promise<PizzaCustomization> {
    return this.pizzaCustomizationsService.update(id, updatePizzaCustomizationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pizza customization' })
  @ApiResponse({
    status: 204,
    description: 'The pizza customization has been successfully deleted.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.pizzaCustomizationsService.remove(id);
  }
}