import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PizzaConfigurationsService } from './pizza-configurations.service';
import { CreatePizzaConfigurationDto } from './dto/create-pizza-configuration.dto';
import { UpdatePizzaConfigurationDto } from './dto/update-pizza-configuration.dto';
import { PizzaConfiguration } from './domain/pizza-configuration';

@ApiTags('Pizza Configurations')
@Controller({
  path: 'pizza-configurations',
  version: '1',
})
export class PizzaConfigurationsController {
  constructor(
    private readonly pizzaConfigurationsService: PizzaConfigurationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pizza configuration' })
  @ApiResponse({
    status: 201,
    description: 'Pizza configuration created successfully',
    type: PizzaConfiguration,
  })
  create(
    @Body() createPizzaConfigurationDto: CreatePizzaConfigurationDto,
  ): Promise<PizzaConfiguration> {
    return this.pizzaConfigurationsService.create(createPizzaConfigurationDto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get pizza configuration by product ID' })
  @ApiResponse({
    status: 200,
    description: 'Pizza configuration found',
    type: PizzaConfiguration,
  })
  @ApiResponse({
    status: 404,
    description: 'Pizza configuration not found',
  })
  findByProductId(@Param('productId') productId: string): Promise<PizzaConfiguration | null> {
    return this.pizzaConfigurationsService.findByProductId(productId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pizza configuration' })
  @ApiResponse({
    status: 200,
    description: 'Pizza configuration updated successfully',
    type: PizzaConfiguration,
  })
  update(
    @Param('id') id: string,
    @Body() updatePizzaConfigurationDto: UpdatePizzaConfigurationDto,
  ): Promise<PizzaConfiguration> {
    return this.pizzaConfigurationsService.update(id, updatePizzaConfigurationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a pizza configuration' })
  @ApiResponse({
    status: 204,
    description: 'Pizza configuration deleted successfully',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.pizzaConfigurationsService.remove(id);
  }
}