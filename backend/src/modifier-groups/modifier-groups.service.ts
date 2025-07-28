import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ModifierGroupRepository } from './infrastructure/persistence/modifier-group.repository';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { ModifierGroup } from './domain/modifier-group';
import { FindAllModifierGroupsDto } from './dto/find-all-modifier-groups.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Paginated } from '../common/types/paginated.type';
import { MODIFIER_GROUP_REPOSITORY } from '../common/tokens';
import {
  CustomIdService,
  EntityPrefix,
} from '../common/services/custom-id.service';

@Injectable()
export class ModifierGroupsService {
  constructor(
    @Inject(MODIFIER_GROUP_REPOSITORY)
    private readonly modifierGroupRepository: ModifierGroupRepository,
    private readonly customIdService: CustomIdService,
  ) {}

  async create(
    createModifierGroupDto: CreateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const data = new ModifierGroup();
    data.id = await this.customIdService.generateId(
      EntityPrefix.MODIFIER_GROUP,
      'modifier_group',
    );
    data.name = createModifierGroupDto.name;
    data.description = createModifierGroupDto.description ?? null;
    data.minSelections = createModifierGroupDto.minSelections ?? 0;
    data.maxSelections = createModifierGroupDto.maxSelections;
    data.isRequired = createModifierGroupDto.isRequired ?? false;
    data.allowMultipleSelections =
      createModifierGroupDto.allowMultipleSelections ?? false;
    data.isActive = createModifierGroupDto.isActive ?? true;
    data.productModifiers = [];
    data.products = [];

    return this.modifierGroupRepository.create(data);
  }

  async findAll(
    findAllModifierGroupsDto: FindAllModifierGroupsDto,
  ): Promise<Paginated<ModifierGroup>> {
    const paginationOptions: IPaginationOptions = {
      page: findAllModifierGroupsDto.page ?? 1,
      limit: findAllModifierGroupsDto.limit ?? 10,
    };

    return this.modifierGroupRepository.findManyWithPagination({
      filterOptions: findAllModifierGroupsDto,
      paginationOptions,
    });
  }

  async findAllNoPagination(
    findAllModifierGroupsDto: FindAllModifierGroupsDto,
  ): Promise<ModifierGroup[]> {
    return this.modifierGroupRepository.findMany({
      filterOptions: findAllModifierGroupsDto,
    });
  }

  async findOne(id: string): Promise<ModifierGroup> {
    const modifierGroup = await this.modifierGroupRepository.findById(id);

    if (!modifierGroup) {
      throw new NotFoundException('Grupo de modificadores no encontrado');
    }

    return modifierGroup;
  }

  async update(
    id: string,
    updateModifierGroupDto: UpdateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const existingModifierGroup =
      await this.modifierGroupRepository.findById(id);

    if (!existingModifierGroup) {
      throw new NotFoundException(`ModifierGroup con ID ${id} no encontrado`);
    }

    const modifierGroup = new ModifierGroup();
    modifierGroup.id = id;
    modifierGroup.name =
      updateModifierGroupDto.name ?? existingModifierGroup.name;
    modifierGroup.description =
      updateModifierGroupDto.description ?? existingModifierGroup.description;
    modifierGroup.minSelections =
      updateModifierGroupDto.minSelections ??
      existingModifierGroup.minSelections;
    modifierGroup.maxSelections =
      updateModifierGroupDto.maxSelections ??
      existingModifierGroup.maxSelections;
    modifierGroup.isRequired =
      updateModifierGroupDto.isRequired ?? existingModifierGroup.isRequired;
    modifierGroup.allowMultipleSelections =
      updateModifierGroupDto.allowMultipleSelections ??
      existingModifierGroup.allowMultipleSelections;
    modifierGroup.isActive =
      updateModifierGroupDto.isActive ?? existingModifierGroup.isActive;

    const updatedModifierGroup = await this.modifierGroupRepository.update(
      id,
      modifierGroup,
    );

    if (!updatedModifierGroup) {
      throw new NotFoundException(
        'Grupo de modificadores no encontrado después de intentar actualizar',
      );
    }

    return updatedModifierGroup;
  }

  async remove(id: string): Promise<void> {
    await this.modifierGroupRepository.remove(id);
  }
}
