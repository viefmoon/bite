import { Injectable, NotFoundException } from '@nestjs/common';
import { PizzaCustomization } from './domain/pizza-customization';
import { PizzaCustomizationRepository } from './infrastructure/persistence/pizza-customization.repository';
import { CreatePizzaCustomizationDto } from './dto/create-pizza-customization.dto';
import { UpdatePizzaCustomizationDto } from './dto/update-pizza-customization.dto';
import { FindAllPizzaCustomizationsDto } from './dto/find-all-pizza-customizations.dto';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class PizzaCustomizationsService {
  constructor(
    private readonly pizzaCustomizationRepository: PizzaCustomizationRepository,
  ) {}

  async create(
    createPizzaCustomizationDto: CreatePizzaCustomizationDto,
  ): Promise<PizzaCustomization> {
    const pizzaCustomization = new PizzaCustomization();
    pizzaCustomization.id = createPizzaCustomizationDto.id;
    pizzaCustomization.name = createPizzaCustomizationDto.name;
    pizzaCustomization.type = createPizzaCustomizationDto.type;
    pizzaCustomization.ingredients =
      createPizzaCustomizationDto.ingredients || null;
    pizzaCustomization.toppingValue =
      createPizzaCustomizationDto.toppingValue ?? 1;
    pizzaCustomization.sortOrder = createPizzaCustomizationDto.sortOrder ?? 0;
    pizzaCustomization.isActive = true;

    return this.pizzaCustomizationRepository.create(pizzaCustomization);
  }

  async findAll(
    query: FindAllPizzaCustomizationsDto,
  ): Promise<Paginated<PizzaCustomization>> {
    const { page = 1, limit = 10, ...filters } = query;

    return this.pizzaCustomizationRepository.findAll({
      page,
      limit,
      ...filters,
    });
  }

  async findOne(id: string): Promise<PizzaCustomization> {
    const pizzaCustomization =
      await this.pizzaCustomizationRepository.findById(id);
    if (!pizzaCustomization) {
      throw new NotFoundException(
        `Pizza customization with ID ${id} not found`,
      );
    }
    return pizzaCustomization;
  }

  async update(
    id: string,
    updatePizzaCustomizationDto: UpdatePizzaCustomizationDto,
  ): Promise<PizzaCustomization> {
    const updated = await this.pizzaCustomizationRepository.update(
      id,
      updatePizzaCustomizationDto,
    );
    if (!updated) {
      throw new NotFoundException(
        `Pizza customization with ID ${id} not found`,
      );
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.pizzaCustomizationRepository.softDelete(id);
  }

  async findByIds(ids: string[]): Promise<PizzaCustomization[]> {
    return this.pizzaCustomizationRepository.findByIds(ids);
  }

  async findAllActive(): Promise<PizzaCustomization[]> {
    const result = await this.pizzaCustomizationRepository.findAll({
      page: 1,
      limit: 1000,
      isActive: true,
    });
    return result.items;
  }
}
