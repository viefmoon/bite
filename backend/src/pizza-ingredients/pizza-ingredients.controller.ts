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
  SerializeOptions,
} from '@nestjs/common';
import { PizzaIngredientsService } from './pizza-ingredients.service';
import { CreatePizzaIngredientDto } from './dto/create-pizza-ingredient.dto';
import { UpdatePizzaIngredientDto } from './dto/update-pizza-ingredient.dto';
import { FindAllPizzaIngredientsDto } from './dto/find-all-pizza-ingredients.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { PizzaIngredient } from './domain/pizza-ingredient';

@ApiTags('Pizza Ingredients')
@Controller({
  path: 'pizza-ingredients',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PizzaIngredientsController {
  constructor(
    private readonly pizzaIngredientsService: PizzaIngredientsService,
  ) {}

  @Post()
  @Roles(RoleEnum.admin)
  @ApiCreatedResponse({
    type: PizzaIngredient,
  })
  @HttpCode(HttpStatus.CREATED)
  @SerializeOptions({
    groups: ['admin'],
  })
  create(@Body() createPizzaIngredientDto: CreatePizzaIngredientDto) {
    return this.pizzaIngredientsService.create(createPizzaIngredientDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOkResponse({
    type: PizzaIngredient,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: FindAllPizzaIngredientsDto,
  ): Promise<InfinityPaginationResponseDto<PizzaIngredient>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;

    const data = await this.pizzaIngredientsService.findAllWithPagination({
      paginationOptions: {
        page,
        limit,
      },
      filterOptions: query,
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('product/:productId')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiParam({ name: 'productId', type: String })
  @ApiOkResponse({
    type: PizzaIngredient,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findByProduct(@Param('productId') productId: string) {
    return this.pizzaIngredientsService.findByProductId(productId);
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    type: PizzaIngredient,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.pizzaIngredientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin)
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    type: PizzaIngredient,
  })
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updatePizzaIngredientDto: UpdatePizzaIngredientDto,
  ) {
    return this.pizzaIngredientsService.update(id, updatePizzaIngredientDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.pizzaIngredientsService.remove(id);
  }
}
