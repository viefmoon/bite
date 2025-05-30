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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { ModifierGroupsService } from './modifier-groups.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { FindAllModifierGroupsDto } from './dto/find-all-modifier-groups.dto';
import { ModifierGroup } from './domain/modifier-group';
import { Paginated } from '../common/types/paginated.type';

@ApiTags('Grupos de Modificadores')
@Controller({
  path: 'modifier-groups',
  version: '1',
})
export class ModifierGroupsController {
  constructor(private readonly modifierGroupsService: ModifierGroupsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createModifierGroupDto: CreateModifierGroupDto,
  ): Promise<ModifierGroup> {
    return this.modifierGroupsService.create(createModifierGroupDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query() findAllModifierGroupsDto: FindAllModifierGroupsDto,
  ): Promise<Paginated<ModifierGroup>> {
    return this.modifierGroupsService.findAll(findAllModifierGroupsDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<ModifierGroup> {
    return this.modifierGroupsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateModifierGroupDto: UpdateModifierGroupDto,
  ): Promise<ModifierGroup> {
    return this.modifierGroupsService.update(id, updateModifierGroupDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.modifierGroupsService.remove(id);
  }
}
