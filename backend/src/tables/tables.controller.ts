import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { Table } from './domain/table';
import { CreateTableDto } from './dto/create-table.dto';
import { FindAllTablesDto } from './dto/find-all-tables.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Tables')
@Controller({
  path: 'tables',
  version: '1',
})
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The table has been successfully created.',
    type: Table,
  })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createTableDto: CreateTableDto): Promise<Table> {
    return this.tablesService.create(createTableDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all tables' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tables',
    type: [Table],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Query() filterOptions: FindAllTablesDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<Table[]> {
    return this.tablesService.findAll(filterOptions, {
      page,
      limit,
    } as IPaginationOptions);
  }

  @Get('area/:areaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tables by area id' })
  @ApiParam({
    name: 'areaId',
    description: 'The id of the area',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tables by area id',
    type: [Table],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findByAreaId(@Param('areaId') areaId: string): Promise<Table[]> {
    return this.tablesService.findByAreaId(areaId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get table by id' })
  @ApiParam({
    name: 'id',
    description: 'The id of the table',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The table has been successfully retrieved.',
    type: Table,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id') id: string): Promise<Table> {
    return this.tablesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update table by id' })
  @ApiParam({
    name: 'id',
    description: 'The id of the table',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The table has been successfully updated.',
    type: Table,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found',
  })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
  ): Promise<Table> {
    return this.tablesService.update(id, updateTableDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete table by id' })
  @ApiParam({
    name: 'id',
    description: 'The id of the table',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The table has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Table not found',
  })
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string): Promise<void> {
    return this.tablesService.remove(id);
  }
}
