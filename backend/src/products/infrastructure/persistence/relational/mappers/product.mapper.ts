import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Product } from '../../../../domain/product';
import { ProductEntity } from '../entities/product.entity';
import { SubcategoryMapper } from '../../../../../subcategories/infrastructure/persistence/relational/mappers/subcategory.mapper';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { ProductVariantMapper } from '../../../../../product-variants/infrastructure/persistence/relational/mappers/product-variant.mapper';
import { ModifierGroupMapper } from '../../../../../modifier-groups/infrastructure/persistence/relational/mappers/modifier-group.mapper';
import { PreparationScreenMapper } from '../../../../../preparation-screens/infrastructure/persistence/relational/mappers/preparation-screen.mapper';
import { PizzaCustomizationMapper } from '../../../../../pizza-customizations/infrastructure/persistence/relational/mappers/pizza-customization.mapper';
import { PizzaConfigurationMapper } from '../../../../../pizza-configurations/infrastructure/persistence/relational/mappers/pizza-configuration.mapper';
import { SubcategoryEntity } from '../../../../../subcategories/infrastructure/persistence/relational/entities/subcategory.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';
import { ModifierGroupEntity } from '../../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';
import { PreparationScreenEntity } from '../../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { ProductVariantEntity } from '../../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { PizzaCustomization } from '../../../../../pizza-customizations/domain/pizza-customization';

@Injectable()
export class ProductMapper extends BaseMapper<ProductEntity, Product> {
  constructor(
    @Inject(forwardRef(() => SubcategoryMapper))
    private readonly subcategoryMapper: SubcategoryMapper,
    private readonly fileMapper: FileMapper,
    @Inject(forwardRef(() => ProductVariantMapper))
    private readonly productVariantMapper: ProductVariantMapper,
    @Inject(forwardRef(() => ModifierGroupMapper))
    private readonly modifierGroupMapper: ModifierGroupMapper,
    @Inject(forwardRef(() => PreparationScreenMapper))
    private readonly preparationScreenMapper: PreparationScreenMapper,
    @Inject(forwardRef(() => PizzaCustomizationMapper))
    private readonly pizzaCustomizationMapper: PizzaCustomizationMapper,
    @Inject(forwardRef(() => PizzaConfigurationMapper))
    private readonly pizzaConfigurationMapper: PizzaConfigurationMapper,
  ) {
    super();
  }

  override toDomain(entity: ProductEntity): Product | null {
    if (!entity) return null;
    const domain = new Product();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.price = entity.price;
    domain.hasVariants = entity.hasVariants;
    domain.isActive = entity.isActive;
    domain.isPizza = entity.isPizza;
    domain.sortOrder = entity.sortOrder;
    domain.subcategoryId = entity.subcategoryId;
    domain.photoId = entity.photoId;
    domain.estimatedPrepTime = entity.estimatedPrepTime;
    domain.preparationScreenId = entity.preparationScreenId;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    domain.photo = entity.photo ? this.fileMapper.toDomain(entity.photo) : null;
    domain.subcategory = entity.subcategory
      ? this.subcategoryMapper.toDomain(entity.subcategory)
      : null;
    domain.variants = mapArray(entity.variants, (variant) =>
      this.productVariantMapper.toDomain(variant),
    );
    domain.modifierGroups = mapArray(entity.modifierGroups, (group) =>
      this.modifierGroupMapper.toDomain(group),
    );
    if (entity.preparationScreen) {
      const screen = this.preparationScreenMapper.toDomain(entity.preparationScreen);
      if (screen) {
        domain.preparationScreen = screen;
      }
    }

    if (entity.pizzaCustomizations) {
      domain.pizzaCustomizations = entity.pizzaCustomizations
        .map((customization) =>
          this.pizzaCustomizationMapper.toDomain(customization),
        )
        .filter((item): item is PizzaCustomization => item !== null);
    }

    if (entity.pizzaConfiguration) {
      const configuration = this.pizzaConfigurationMapper.toDomain(
        entity.pizzaConfiguration,
      );
      if (configuration) {
        domain.pizzaConfiguration = configuration;
      }
    }

    return domain;
  }

  override toEntity(domain: Product): ProductEntity | null {
    if (!domain) return null;
    const entity = new ProductEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.price = domain.price;
    entity.hasVariants = domain.hasVariants;
    entity.isActive = domain.isActive;
    entity.isPizza = domain.isPizza;
    entity.sortOrder = domain.sortOrder;
    entity.subcategoryId = domain.subcategoryId;
    entity.subcategory = { id: domain.subcategoryId } as SubcategoryEntity;
    entity.photoId = domain.photoId || null;
    entity.photo = domain.photoId
      ? ({ id: domain.photoId } as FileEntity)
      : null;
    entity.estimatedPrepTime = domain.estimatedPrepTime;

    // Establecer tanto la relación como el ID de preparationScreen
    if (domain.preparationScreenId) {
      entity.preparationScreenId = domain.preparationScreenId;
      entity.preparationScreen = { id: domain.preparationScreenId } as PreparationScreenEntity;
    } else if (domain.preparationScreen?.id) {
      entity.preparationScreenId = domain.preparationScreen.id;
      entity.preparationScreen = {
        id: domain.preparationScreen.id,
      } as PreparationScreenEntity;
    }

    if (domain.modifierGroups !== undefined) {
      entity.modifierGroups = domain.modifierGroups.map(
        (group) => ({ id: group.id }) as ModifierGroupEntity,
      );
    }

    if (domain.variants !== undefined) {
      entity.variants = domain.variants
        .map((variant) => this.productVariantMapper.toEntity(variant))
        .filter((entity): entity is ProductVariantEntity => entity !== null);
    }

    return entity;
  }
}
