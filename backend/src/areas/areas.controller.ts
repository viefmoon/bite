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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { Area } from './domain/area';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAllAreasDto } from './dto/find-all-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Areas')
@Controller({ path: 'areas', version: '1' })
export class AreasController {
  constructor(private readonly service: AreasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new area' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAreaDto): Promise<Area> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all areas' })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() q: FindAllAreasDto): Promise<Area[]> {
    return this.service.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one area by ID' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<Area> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an area' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAreaDto,
  ): Promise<Area | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an area' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
