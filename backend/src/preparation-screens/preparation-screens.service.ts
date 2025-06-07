import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PreparationScreen } from './domain/preparation-screen';
import { CreatePreparationScreenDto } from './dto/create-preparation-screen.dto';
import { FindAllPreparationScreensDto } from './dto/find-all-preparation-screens.dto';
import { UpdatePreparationScreenDto } from './dto/update-preparation-screen.dto';
import { PreparationScreenRepository } from './infrastructure/persistence/preparation-screen.repository';
import {
  PREPARATION_SCREEN_REPOSITORY,
  PRODUCT_REPOSITORY,
  CATEGORY_REPOSITORY,
  SUBCATEGORY_REPOSITORY,
} from '../common/tokens';
import { Paginated } from '../common/types/paginated.type';
import { ProductRepository } from '../products/infrastructure/persistence/product.repository';
import { CategoryRepository } from '../categories/infrastructure/persistence/category.repository';
import { SubcategoryRepository } from '../subcategories/infrastructure/persistence/subcategory.repository';

@Injectable()
export class PreparationScreensService {
  constructor(
    @Inject(PREPARATION_SCREEN_REPOSITORY)
    private readonly preparationScreenRepository: PreparationScreenRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: SubcategoryRepository,
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

    // Actualizar la pantalla de preparación
    const updatedScreen = await this.preparationScreenRepository.update(
      id,
      preparationScreen,
    );

    // Si se proporcionan productIds, actualizar las asociaciones
    if (updateDto.productIds !== undefined) {
      // Primero, desasociar todos los productos que actualmente tienen esta pantalla
      const currentProducts = existingScreen.products || [];
      for (const product of currentProducts) {
        await this.productRepository.updatePreparationScreen(product.id, null);
      }

      // Luego, asociar los nuevos productos
      if (updateDto.productIds.length > 0) {
        for (const productId of updateDto.productIds) {
          await this.productRepository.updatePreparationScreen(productId, id);
        }
      }

      // Retornar la pantalla actualizada con los productos actualizados
      return this.preparationScreenRepository.findOne(id);
    }

    return updatedScreen;
  }

  async remove(id: string): Promise<void> {
    return this.preparationScreenRepository.softDelete(id);
  }

  async getProducts(id: string): Promise<any> {
    const screen = await this.preparationScreenRepository.findOne(id);
    if (!screen) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }
    return screen.products || [];
  }

  async associateProducts(
    id: string,
    productIds: string[],
  ): Promise<PreparationScreen> {
    const screen = await this.preparationScreenRepository.findOne(id);
    if (!screen) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    // Primero, desasociar todos los productos actuales
    const currentProducts = screen.products || [];
    for (const product of currentProducts) {
      await this.productRepository.updatePreparationScreen(product.id, null);
    }

    // Luego, asociar los nuevos productos
    for (const productId of productIds) {
      await this.productRepository.updatePreparationScreen(productId, id);
    }

    // Retornar la pantalla actualizada
    return this.preparationScreenRepository.findOne(id);
  }

  async getMenuWithAssociations(screenId: string): Promise<any> {
    // Verificar que la pantalla existe
    const screen = await this.preparationScreenRepository.findOne(screenId);
    if (!screen) {
      throw new NotFoundException(
        `Preparation screen with ID ${screenId} not found`,
      );
    }

    // Obtener todas las categorías con sus subcategorías y productos
    const categories = await this.categoryRepository.findAll({
      page: 1,
      limit: 1000, // Obtener todas
      isActive: true,
    });

    // Construir la estructura del menú con información de asociaciones
    const menuWithAssociations: any[] = [];

    for (const category of categories) {
      const categoryData: any = {
        id: category.id,
        name: category.name,
        photo: category.photo,
        subcategories: [],
      };

      // Obtener subcategorías de esta categoría
      const subcategories = await this.subcategoryRepository.findAll({
        page: 1,
        limit: 1000,
        categoryId: category.id,
        isActive: true,
      });

      for (const subcategory of subcategories.items) {
        const subcategoryData: any = {
          id: subcategory.id,
          name: subcategory.name,
          photo: subcategory.photo,
          products: [],
        };

        // Obtener productos de esta subcategoría
        const products = await this.productRepository.findAll({
          page: 1,
          limit: 1000,
          subcategoryId: subcategory.id,
          isActive: true,
        });

        for (const product of products.items) {
          subcategoryData.products.push({
            id: product.id,
            name: product.name,
            photo: product.photo,
            price: product.price,
            isAssociated: product.preparationScreenId === screenId,
            currentPreparationScreenId: product.preparationScreenId,
          });
        }

        categoryData.subcategories.push(subcategoryData);
      }

      menuWithAssociations.push(categoryData);
    }

    return {
      screenId,
      screenName: screen.name,
      menu: menuWithAssociations,
    };
  }
}
