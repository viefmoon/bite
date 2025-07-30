import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { ProductsService } from '../products/products.service';
import { ModifierGroupsService } from '../modifier-groups/modifier-groups.service';
import { ProductModifiersService } from '../product-modifiers/product-modifiers.service';
import { PizzaCustomizationsService } from '../pizza-customizations/pizza-customizations.service';
import {
  AvailabilityType,
  AvailabilityUpdateDto,
} from './dto/availability-update.dto';
import {
  CategoryAvailabilityDto,
  SubcategoryAvailabilityDto,
  ModifierGroupAvailabilityDto,
} from './dto/menu-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly subcategoriesService: SubcategoriesService,
    private readonly productsService: ProductsService,
    private readonly modifierGroupsService: ModifierGroupsService,
    private readonly productModifiersService: ProductModifiersService,
    private readonly pizzaCustomizationsService: PizzaCustomizationsService,
  ) {}

  async getMenuAvailability(): Promise<CategoryAvailabilityDto[]> {
    const categoriesResult = await this.categoriesService.findAllPaginated({
      page: 1,
      limit: 1000,
      isActive: undefined,
    });

    const menuAvailability: CategoryAvailabilityDto[] = [];

    for (const category of categoriesResult.items) {
      const subcategories = await this.subcategoriesService.findAllByCategoryId(
        category.id,
      );

      const subcategoriesWithProducts: SubcategoryAvailabilityDto[] = [];
      for (const subcategory of subcategories) {
        const products = await this.productsService.findAllBySubcategoryId(
          subcategory.id,
        );

        subcategoriesWithProducts.push({
          id: subcategory.id,
          name: subcategory.name,
          isActive: subcategory.isActive ?? true,
          categoryId: subcategory.categoryId,
          products: products.map((product) => ({
            id: product.id,
            name: product.name,
            isActive: product.isActive ?? true,
            subcategoryId: product.subcategoryId,
          })),
        });
      }

      menuAvailability.push({
        id: category.id,
        name: category.name,
        isActive: category.isActive ?? true,
        subcategories: subcategoriesWithProducts,
      });
    }

    return menuAvailability;
  }

  async getPizzaCustomizationsAvailability(): Promise<
    { type: string; items: any[] }[]
  > {
    const customizationsResult = await this.pizzaCustomizationsService.findAll({
      page: 1,
      limit: 1000,
      isActive: undefined,
    });

    const groupedByType = customizationsResult.items.reduce(
      (acc, customization) => {
        const type = customization.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push({
          id: customization.id,
          name: customization.name,
          type: customization.type,
          isActive: customization.isActive ?? true,
          sortOrder: customization.sortOrder,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return Object.entries(groupedByType).map(([type, items]) => ({
      type,
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async getModifierGroupsAvailability(): Promise<
    ModifierGroupAvailabilityDto[]
  > {
    const modifierGroupsResult = await this.modifierGroupsService.findAll({
      page: 1,
      limit: 1000,
      isActive: undefined,
    });

    const availability: ModifierGroupAvailabilityDto[] = [];

    for (const group of modifierGroupsResult.items) {
      const modifiers = await this.productModifiersService.findByGroupId(
        group.id,
      );

      availability.push({
        id: group.id,
        name: group.name,
        isActive: group.isActive ?? true,
        modifiers: modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          isActive: modifier.isActive ?? true,
          modifierGroupId: modifier.modifierGroupId,
        })),
      });
    }

    return availability;
  }

  async updateAvailability(dto: AvailabilityUpdateDto): Promise<void> {
    const { type, id, isActive, cascade } = dto;

    switch (type) {
      case AvailabilityType.CATEGORY:
        await this.updateCategoryAvailability(id, isActive, cascade);
        break;
      case AvailabilityType.SUBCATEGORY:
        await this.updateSubcategoryAvailability(id, isActive, cascade);
        break;
      case AvailabilityType.PRODUCT:
        await this.updateProductAvailability(id, isActive);
        break;
      case AvailabilityType.MODIFIER_GROUP:
        await this.updateModifierGroupAvailability(id, isActive, cascade);
        break;
      case AvailabilityType.MODIFIER:
        await this.updateModifierAvailability(id, isActive);
        break;
      case AvailabilityType.PIZZA_CUSTOMIZATION:
        await this.updatePizzaCustomizationAvailability(id, isActive);
        break;
    }
  }

  private async updateCategoryAvailability(
    categoryId: string,
    isActive: boolean,
    cascade?: boolean,
  ): Promise<void> {
    await this.categoriesService.update(categoryId, { isActive });

    if (cascade) {
      const subcategories =
        await this.subcategoriesService.findAllByCategoryId(categoryId);

      for (const subcategory of subcategories) {
        await this.updateSubcategoryAvailability(
          subcategory.id,
          isActive,
          true,
        );
      }
    }
  }

  private async updateSubcategoryAvailability(
    subcategoryId: string,
    isActive: boolean,
    cascade?: boolean,
  ): Promise<void> {
    await this.subcategoriesService.update(subcategoryId, { isActive });

    if (cascade) {
      const products =
        await this.productsService.findAllBySubcategoryId(subcategoryId);

      for (const product of products) {
        await this.productsService.update(product.id, { isActive });
      }
    }
  }

  private async updateProductAvailability(
    productId: string,
    isActive: boolean,
  ): Promise<void> {
    await this.productsService.update(productId, { isActive });
  }

  private async updateModifierGroupAvailability(
    groupId: string,
    isActive: boolean,
    cascade?: boolean,
  ): Promise<void> {
    await this.modifierGroupsService.update(groupId, { isActive });

    if (cascade) {
      const modifiers =
        await this.productModifiersService.findByGroupId(groupId);

      for (const modifier of modifiers) {
        await this.productModifiersService.update(modifier.id, { isActive });
      }
    }
  }

  private async updateModifierAvailability(
    modifierId: string,
    isActive: boolean,
  ): Promise<void> {
    await this.productModifiersService.update(modifierId, { isActive });
  }

  private async updatePizzaCustomizationAvailability(
    customizationId: string,
    isActive: boolean,
  ): Promise<void> {
    await this.pizzaCustomizationsService.update(customizationId, { isActive });
  }

  async bulkUpdateAvailability(
    updates: AvailabilityUpdateDto[],
  ): Promise<void> {
    for (const update of updates) {
      await this.updateAvailability(update);
    }
  }
}
