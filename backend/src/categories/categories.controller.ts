import {
  Get,
  HttpCode,
  HttpStatus,
  Controller,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FindAllCategoriesDto } from './dto/find-all-categories.dto';
import { Category } from './domain/category';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Categorías')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all categories' })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() q: FindAllCategoriesDto): Promise<Category[]> {
    return this.service.findAll(q);
  }

  @Get('full-menu')
  @ApiOperation({
    summary:
      'Obtener el menú completo (categorías, subcategorías, productos, modificadores)',
  })
  @HttpCode(HttpStatus.OK)
  getFullMenu(): Promise<Category[]> {
    return this.service.getFullMenu();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one category by ID' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<Category> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a category' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
