import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_CODES } from '../common/constants/error-codes.constants';
import { CustomConflictException } from '../common/exceptions/custom-conflict.exception';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './domain/product';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { ProductVariantRepository } from '../product-variants/infrastructure/persistence/product-variant.repository';
import { ProductVariant } from '../product-variants/domain/product-variant';
import { ModifierGroupRepository } from '../modifier-groups/infrastructure/persistence/modifier-group.repository';
import { ModifierGroup } from '../modifier-groups/domain/modifier-group';
import { PreparationScreenRepository } from '../preparation-screens/infrastructure/persistence/preparation-screen.repository';
import {
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  MODIFIER_GROUP_REPOSITORY,
  PREPARATION_SCREEN_REPOSITORY,
} from '../common/tokens';
import { Paginated } from '../common/types/paginated.type';
import {
  CustomIdService,
  EntityPrefix,
} from '../common/services/custom-id.service';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: ProductVariantRepository,
    @Inject(MODIFIER_GROUP_REPOSITORY)
    private readonly modifierGroupRepository: ModifierGroupRepository,
    @Inject(PREPARATION_SCREEN_REPOSITORY)
    private readonly preparationScreenRepository: PreparationScreenRepository,
    private readonly customIdService: CustomIdService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingProducts = await this.productRepository.findAll({
      page: 1,
      limit: 1,
      search: createProductDto.name,
    });

    if (
      existingProducts.items.length > 0 &&
      existingProducts.items[0].name === createProductDto.name
    ) {
      throw new CustomConflictException(
        `Ya existe un producto con el nombre "${createProductDto.name}"`,
        ERROR_CODES.PRODUCT_NAME_EXISTS,
      );
    }

    const product = new Product();
    product.id = await this.customIdService.generateId(
      EntityPrefix.PRODUCT,
      'product',
    );
    product.name = createProductDto.name;
    product.description = createProductDto.description ?? null;
    product.price = createProductDto.price ?? null;
    product.hasVariants = createProductDto.hasVariants ?? false;
    product.isActive = createProductDto.isActive ?? true;
    product.isPizza = createProductDto.isPizza ?? false;
    product.subcategoryId = createProductDto.subcategoryId;
    product.estimatedPrepTime = createProductDto.estimatedPrepTime;
    product.photoId = createProductDto.photoId ?? null;

    if (createProductDto.photoId) {
      product.photo = {
        id: createProductDto.photoId,
        path: '',
      };
    }

    if (
      createProductDto.modifierGroupIds &&
      createProductDto.modifierGroupIds.length > 0
    ) {
      const modifierGroups: ModifierGroup[] = [];
      for (const groupId of createProductDto.modifierGroupIds) {
        try {
          const group = await this.modifierGroupRepository.findById(groupId);
          if (!group) {
            throw new NotFoundException(
              `ModifierGroup with ID ${groupId} not found during creation`,
            );
          }
          modifierGroups.push(group);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw error;
        }
      }
      product.modifierGroups = modifierGroups;
    } else {
      product.modifierGroups = [];
    }

    // preparationScreenId es opcional
    if (createProductDto.preparationScreenId) {
      try {
        const screen = await this.preparationScreenRepository.findOne(
          createProductDto.preparationScreenId,
        );
        product.preparationScreen = screen;
        product.preparationScreenId = createProductDto.preparationScreenId;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(
            `PreparationScreen with ID ${createProductDto.preparationScreenId} not found during product creation`,
          );
        }
        throw error;
      }
    } else {
      product.preparationScreen = null;
      product.preparationScreenId = null;
    }

    const createdProduct = await this.productRepository.create(product);

    if (
      createProductDto.hasVariants &&
      createProductDto.variants &&
      createProductDto.variants.length > 0
    ) {
      const variants: ProductVariant[] = [];
      for (const variantDto of createProductDto.variants) {
        const variantToCreate = new ProductVariant();
        variantToCreate.id = await this.customIdService.generateId(
          EntityPrefix.PRODUCT_VARIANT,
          'product_variant',
        );
        variantToCreate.productId = createdProduct.id;
        variantToCreate.name = variantDto.name;
        variantToCreate.price = variantDto.price;
        variantToCreate.isActive = variantDto.isActive ?? true;
        const variant =
          await this.productVariantRepository.create(variantToCreate);
        variants.push(variant);
      }
      createdProduct.variants = variants;
    }

    // Es importante devolver el producto creado que puede incluir las variantes añadidas
    // Si el repositorio 'create' no devuelve las variantes, podríamos necesitar recargar el producto
    // return createdProduct;
    // Opcionalmente, recargar para asegurar que todas las relaciones estén presentes:
    return this.productRepository.findOne(
      createdProduct.id,
    ) as Promise<Product>; // Asegurar que findOne no devuelva null
  }

  async findAll(
    findAllProductsDto: FindAllProductsDto,
  ): Promise<Paginated<Product>> {
    return this.productRepository.findAll({
      page: findAllProductsDto.page || 1,
      limit: findAllProductsDto.limit || 10,
      subcategoryId: findAllProductsDto.subcategoryId,
      hasVariants: findAllProductsDto.hasVariants,
      isActive: findAllProductsDto.isActive,
      search: findAllProductsDto.search,
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Si se está actualizando el nombre, verificar que no exista otro producto con ese nombre
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProducts = await this.productRepository.findAll({
        page: 1,
        limit: 1,
        search: updateProductDto.name,
      });

      if (
        existingProducts.items.length > 0 &&
        existingProducts.items[0].name === updateProductDto.name &&
        existingProducts.items[0].id !== id
      ) {
        throw new CustomConflictException(
          `Ya existe un producto con el nombre "${updateProductDto.name}"`,
          ERROR_CODES.PRODUCT_NAME_EXISTS,
        );
      }
    }

    // Actualizar propiedades directas del producto
    product.name = updateProductDto.name ?? product.name;
    product.description =
      updateProductDto.description === null
        ? null
        : (updateProductDto.description ?? product.description);
    product.price =
      updateProductDto.price === null
        ? null
        : (updateProductDto.price ?? product.price);
    product.hasVariants = updateProductDto.hasVariants ?? product.hasVariants;
    product.isActive = updateProductDto.isActive ?? product.isActive;
    product.isPizza = updateProductDto.isPizza ?? product.isPizza;
    product.subcategoryId =
      updateProductDto.subcategoryId ?? product.subcategoryId;
    product.estimatedPrepTime =
      updateProductDto.estimatedPrepTime ?? product.estimatedPrepTime;

    // Actualizar foto
    if (updateProductDto.photoId !== undefined) {
      product.photo = updateProductDto.photoId
        ? {
            id: updateProductDto.photoId,
            path: '', // Path se resolverá en el dominio si es necesario
          }
        : null;
      product.photoId = updateProductDto.photoId; // Asegurar que photoId también se actualice
    }

    // Actualizar grupos de modificadores
    if (updateProductDto.modifierGroupIds !== undefined) {
      if (updateProductDto.modifierGroupIds.length > 0) {
        const modifierGroups: ModifierGroup[] = [];
        for (const groupId of updateProductDto.modifierGroupIds) {
          try {
            // Usar repositorio en lugar de servicio
            const group = await this.modifierGroupRepository.findById(groupId);
            if (!group) {
              // Manejar caso donde findById devuelve null
              throw new NotFoundException(
                `ModifierGroup with ID ${groupId} not found during update`,
              );
            }
            modifierGroups.push(group);
          } catch (error) {
            // Mantener el manejo de NotFoundException por si findById lanza otro error
            if (error instanceof NotFoundException) {
              throw error; // Re-lanzar
            }
            throw error; // Lanzar otros errores
          }
        }
        product.modifierGroups = modifierGroups;
      } else {
        product.modifierGroups = []; // Vaciar si el array está vacío
      }
    }

    // Actualizar pantalla de preparación
    if (updateProductDto.preparationScreenId !== undefined) {
      if (updateProductDto.preparationScreenId === null) {
        // Si se envía null, remover la pantalla de preparación
        product.preparationScreen = null;
        product.preparationScreenId = null;
      } else {
        // Si se envía un ID, buscar y asignar la pantalla
        try {
          const screen = await this.preparationScreenRepository.findOne(
            updateProductDto.preparationScreenId,
          );
          product.preparationScreen = screen;
          product.preparationScreenId = screen.id;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw new NotFoundException(
              `PreparationScreen with ID ${updateProductDto.preparationScreenId} not found during product update`,
            );
          }
          throw error;
        }
      }
    }

    // Guardar el producto actualizado (incluyendo relaciones actualizadas)
    // Usar 'save' para que TypeORM maneje las relaciones ManyToMany correctamente
    const savedProduct = await this.productRepository.save(product);

    // Sincronizar variantes si se proporcionan en el DTO
    if (updateProductDto.variants !== undefined) {
      const currentVariants =
        // Usar repositorio en lugar de servicio
        await this.productVariantRepository.findAllByProductId(id);
      const currentVariantIds = currentVariants.map((v) => v.id);

      const incomingVariantsData = updateProductDto.variants || [];
      const incomingVariantIds = new Set(
        incomingVariantsData.filter((v) => v.id).map((v) => v.id as string), // Asegurar que id es string
      );

      const processedVariantIds: string[] = [];
      for (const variantDto of incomingVariantsData) {
        if (variantDto.id) {
          // Actualizar variante existente
          if (currentVariantIds.includes(variantDto.id)) {
            // Buscar la variante actual para mantener sus propiedades
            const currentVariant = currentVariants.find(
              (v) => v.id === variantDto.id,
            );
            if (currentVariant) {
              // Crear objeto completo con los datos actualizados
              const variantToUpdate = new ProductVariant();
              variantToUpdate.id = variantDto.id;
              variantToUpdate.productId = id;
              variantToUpdate.name = variantDto.name ?? currentVariant.name;
              variantToUpdate.price = variantDto.price ?? currentVariant.price;
              variantToUpdate.isActive =
                variantDto.isActive ?? currentVariant.isActive;

              await this.productVariantRepository.update(
                variantDto.id,
                variantToUpdate,
              );
              processedVariantIds.push(variantDto.id);
            }
          } else {
            // Advertir si se intenta actualizar una variante que no pertenece al producto
          }
        } else {
          // Crear nueva variante
          // Usar repositorio en lugar de servicio
          const variantToCreate = new ProductVariant();
          variantToCreate.id = await this.customIdService.generateId(
            EntityPrefix.PRODUCT_VARIANT,
            'product_variant',
          );
          variantToCreate.productId = id; // Asociar al producto actual
          variantToCreate.name = variantDto.name || '';
          variantToCreate.price = variantDto.price || 0;
          variantToCreate.isActive = variantDto.isActive ?? true;
          const newVariant =
            await this.productVariantRepository.create(variantToCreate);
          processedVariantIds.push(newVariant.id);
        }
      }

      // Eliminar variantes que ya no están en la lista
      const variantsToDelete = currentVariants.filter(
        (v) => !incomingVariantIds.has(v.id),
      );
      for (const variantToDelete of variantsToDelete) {
        // Usar repositorio en lugar de servicio
        await this.productVariantRepository.softDelete(variantToDelete.id);
      }
    }

    // Recargar el producto después de todas las operaciones para devolver el estado final
    return this.productRepository.findOne(savedProduct.id) as Promise<Product>; // Asegurar que findOne no devuelva null
  }

  async remove(id: string): Promise<void> {
    await this.productRepository.softDelete(id);
  }

  async findAllPizzas(): Promise<Product[]> {
    return this.productRepository.findAllPizzas();
  }

  async findAllBySubcategoryId(subcategoryId: string): Promise<Product[]> {
    const result = await this.productRepository.findAll({
      page: 1,
      limit: 1000, // Un límite alto para obtener todos
      subcategoryId,
    });
    return result.items;
  }

  async getPizzaCustomizations(id: string): Promise<any[]> {
    const product =
      await this.productRepository.findOneWithPizzaCustomizations(id);
    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado`,
        ERROR_CODES.PRODUCT_NOT_FOUND,
      );
    }
    return product.pizzaCustomizations || [];
  }

  async updatePizzaCustomizations(
    id: string,
    customizationIds: string[],
  ): Promise<Product> {
    const product = await this.productRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado`,
        ERROR_CODES.PRODUCT_NOT_FOUND,
      );
    }

    // Actualizar las personalizaciones
    await this.productRepository.updatePizzaCustomizations(
      id,
      customizationIds,
    );

    // Retornar el producto actualizado con las personalizaciones
    const updatedProduct =
      await this.productRepository.findOneWithPizzaCustomizations(id);
    if (!updatedProduct) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado después de actualizar`,
        ERROR_CODES.PRODUCT_NOT_FOUND,
      );
    }
    return updatedProduct;
  }
}
