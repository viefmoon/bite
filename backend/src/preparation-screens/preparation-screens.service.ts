import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PreparationScreen } from './domain/preparation-screen';
import { CreatePreparationScreenDto } from './dto/create-preparation-screen.dto';
import { FindAllPreparationScreensDto } from './dto/find-all-preparation-screens.dto';
import { UpdatePreparationScreenDto } from './dto/update-preparation-screen.dto';
import { PreparationScreenRepository } from './infrastructure/persistence/preparation-screen.repository';
import { PREPARATION_SCREEN_REPOSITORY } from '../common/tokens';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class PreparationScreensService {
  constructor(
    @Inject(PREPARATION_SCREEN_REPOSITORY)
    private readonly preparationScreenRepository: PreparationScreenRepository,
  ) {}

  async create(
    createDto: CreatePreparationScreenDto,
  ): Promise<PreparationScreen> {
    const preparationScreen = new PreparationScreen();
    preparationScreen.name = createDto.name;
    preparationScreen.description = createDto.description || null;
    preparationScreen.isActive = createDto.isActive ?? true;

    return this.preparationScreenRepository.create(preparationScreen);
  }

  async findAll(
    findAllPreparationScreensDto: FindAllPreparationScreensDto,
  ): Promise<Paginated<PreparationScreen>> {
    return this.preparationScreenRepository.findAll({
      page: findAllPreparationScreensDto.page,
      limit: findAllPreparationScreensDto.limit,
      isActive: findAllPreparationScreensDto.isActive,
    });
  }

  async findOne(id: string): Promise<PreparationScreen> {
    const preparationScreen =
      await this.preparationScreenRepository.findOne(id);

    if (!preparationScreen) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    return preparationScreen;
  }

  async update(
    id: string,
    updateDto: UpdatePreparationScreenDto,
  ): Promise<PreparationScreen> {
    const existingScreen = await this.preparationScreenRepository.findOne(id);
    if (!existingScreen) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    const preparationScreen = new PreparationScreen();
    preparationScreen.id = id;
    preparationScreen.name = updateDto.name ?? existingScreen.name;
    preparationScreen.description =
      updateDto.description ?? existingScreen.description;
    preparationScreen.isActive = updateDto.isActive ?? existingScreen.isActive;

    return this.preparationScreenRepository.update(id, preparationScreen);
  }

  async remove(id: string): Promise<void> {
    return this.preparationScreenRepository.softDelete(id);
  }
}
