import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { SubcategoriesService } from '../subcategories/subcategories.service';
import { ProductsService } from '../products/products.service';
import { ModifierGroupsService } from '../modifier-groups/modifier-groups.service';
import { ProductModifiersService } from '../product-modifiers/product-modifiers.service';
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
  ) {}

  async getMenuAvailability(): Promise<CategoryAvailabilityDto[]> {
    // Obtener todas las categorías (activas e inactivas)
    const categoriesResult = await this.categoriesService.findAllPaginated({
      page: 1,
      limit: 1000,
      isActive: undefined, // Obtener todas, activas e inactivas
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

      const categoryAvailability: CategoryAvailabilityDto = {
        id: category.id,
        name: category.name,
        isActive: category.isActive ?? true,
        subcategories: subcategoriesWithProducts,
      };

      menuAvailability.push(categoryAvailability);
    }

    return menuAvailability;
  }

  async getModifierGroupsAvailability(): Promise<
    ModifierGroupAvailabilityDto[]
  > {
    // Obtener todos los grupos de modificadores (activos e inactivos)
    const modifierGroupsResult = await this.modifierGroupsService.findAll({
      page: 1,
      limit: 1000,
      isActive: undefined, // Obtener todos, activos e inactivos
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
    }
  }

  private async updateCategoryAvailability(
    categoryId: string,
    isActive: boolean,
    cascade?: boolean,
  ): Promise<void> {
    // Actualizar la categoría
    await this.categoriesService.update(categoryId, { isActive });

    if (cascade) {
      // Obtener todas las subcategorías de esta categoría
      const subcategories =
        await this.subcategoriesService.findAllByCategoryId(categoryId);

      // Actualizar cada subcategoría y sus productos
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
    // Actualizar la subcategoría
    await this.subcategoriesService.update(subcategoryId, { isActive });

    if (cascade) {
      // Obtener todos los productos de esta subcategoría
      const products =
        await this.productsService.findAllBySubcategoryId(subcategoryId);

      // Actualizar cada producto
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
    // Actualizar el grupo de modificadores
    await this.modifierGroupsService.update(groupId, { isActive });

    if (cascade) {
      // Obtener todos los modificadores de este grupo
      const modifiers =
        await this.productModifiersService.findByGroupId(groupId);

      // Actualizar cada modificador
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

  async bulkUpdateAvailability(
    updates: AvailabilityUpdateDto[],
  ): Promise<void> {
    // Procesar las actualizaciones en orden para respetar las dependencias
    for (const update of updates) {
      await this.updateAvailability(update);
    }
  }
}
