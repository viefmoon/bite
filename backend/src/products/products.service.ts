import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './domain/product';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { ProductVariantRepository } from '../product-variants/infrastructure/persistence/product-variant.repository'; // Importar repositorio
import { ProductVariant } from '../product-variants/domain/product-variant';
import { ModifierGroupRepository } from '../modifier-groups/infrastructure/persistence/modifier-group.repository'; // Importar repositorio
import { ModifierGroup } from '../modifier-groups/domain/modifier-group';
import { PreparationScreenRepository } from '../preparation-screens/infrastructure/persistence/preparation-screen.repository'; // Importar repositorio
import {
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  MODIFIER_GROUP_REPOSITORY,
  PREPARATION_SCREEN_REPOSITORY,
} from '../common/tokens';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PRODUCT_VARIANT_REPOSITORY) // Inyectar repositorio
    private readonly productVariantRepository: ProductVariantRepository,
    @Inject(MODIFIER_GROUP_REPOSITORY) // Inyectar repositorio
    private readonly modifierGroupRepository: ModifierGroupRepository,
    @Inject(PREPARATION_SCREEN_REPOSITORY) // Inyectar repositorio
    private readonly preparationScreenRepository: PreparationScreenRepository,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new Product();
    product.name = createProductDto.name;
    product.price = createProductDto.price ?? null;
    product.hasVariants = createProductDto.hasVariants ?? false;
    product.isActive = createProductDto.isActive ?? true;
    product.subcategoryId = createProductDto.subcategoryId;
    product.estimatedPrepTime = createProductDto.estimatedPrepTime;
    product.photoId = createProductDto.photoId ?? null;

    if (createProductDto.photoId) {
      product.photo = {
        id: createProductDto.photoId,
        path: '', // Path se resolverá en el dominio si es necesario
      };
    }

    if (
      createProductDto.modifierGroupIds &&
      createProductDto.modifierGroupIds.length > 0
    ) {
      const modifierGroups: ModifierGroup[] = [];
      for (const groupId of createProductDto.modifierGroupIds) {
        try {
          // Usar repositorio en lugar de servicio
          const group = await this.modifierGroupRepository.findById(groupId);
          if (!group) { // Manejar caso donde findById devuelve null
            throw new NotFoundException(
              `ModifierGroup with ID ${groupId} not found during creation`,
            );
          }
          modifierGroups.push(group);
        } catch (error) {
          // Mantener el manejo de NotFoundException por si findById lanza otro error
          if (error instanceof NotFoundException) {
            // Re-lanzar la excepción original para mantener el mensaje específico
            throw error;
          }
          // Lanzar otros errores inesperados
          throw error;
        }
      }
      product.modifierGroups = modifierGroups;
    } else {
      product.modifierGroups = [];
    }

    if (createProductDto.preparationScreenId) {
      try {
        // Usar repositorio en lugar de servicio
        const screen = await this.preparationScreenRepository.findOne(
          createProductDto.preparationScreenId,
        );
        // findOne ya lanza NotFoundException si no encuentra
        product.preparationScreen = screen;
      } catch (error) {
        // Mantener el manejo de NotFoundException por si findOne lanza otro error
        if (error instanceof NotFoundException) {
          // Re-lanzar la excepción original para mantener el mensaje específico
           throw new NotFoundException(
             `PreparationScreen with ID ${createProductDto.preparationScreenId} not found during product creation`,
           );
        }
        // Lanzar otros errores inesperados
        throw error;
      }
    } else {
      product.preparationScreen = null;
    }

    const createdProduct = await this.productRepository.create(product);

    if (
      createProductDto.hasVariants &&
      createProductDto.variants &&
      createProductDto.variants.length > 0
    ) {
      const variants: ProductVariant[] = [];
      for (const variantDto of createProductDto.variants) {
        // Usar repositorio en lugar de servicio
        const variantToCreate = new ProductVariant();
        variantToCreate.productId = createdProduct.id;
        variantToCreate.name = variantDto.name;
        variantToCreate.price = variantDto.price;
        variantToCreate.isActive = variantDto.isActive ?? true;
        const variant = await this.productVariantRepository.create(variantToCreate);
        variants.push(variant);
      }
      createdProduct.variants = variants;
    }

    // Es importante devolver el producto creado que puede incluir las variantes añadidas
    // Si el repositorio 'create' no devuelve las variantes, podríamos necesitar recargar el producto
    // return createdProduct;
    // Opcionalmente, recargar para asegurar que todas las relaciones estén presentes:
     return this.productRepository.findOne(createdProduct.id) as Promise<Product>; // Asegurar que findOne no devuelva null
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

    // Actualizar propiedades directas del producto
    product.name = updateProductDto.name ?? product.name;
    product.price =
      updateProductDto.price === null
        ? null
        : (updateProductDto.price ?? product.price);
    product.hasVariants = updateProductDto.hasVariants ?? product.hasVariants;
    product.isActive = updateProductDto.isActive ?? product.isActive;
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
            if (!group) { // Manejar caso donde findById devuelve null
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
        product.preparationScreen = null;
        product.preparationScreenId = null; // Asegurar que el ID también se actualice
      } else {
        try {
          // Usar repositorio en lugar de servicio
          const screen = await this.preparationScreenRepository.findOne(
            updateProductDto.preparationScreenId,
          );
          // findOne ya lanza NotFoundException si no encuentra
          product.preparationScreen = screen;
          product.preparationScreenId = screen.id; // Asegurar que el ID también se actualice
        } catch (error) {
          // Mantener el manejo de NotFoundException por si findOne lanza otro error
          if (error instanceof NotFoundException) {
             throw new NotFoundException(
               `PreparationScreen with ID ${updateProductDto.preparationScreenId} not found during product update`,
             );
          }
          throw error; // Lanzar otros errores
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
            // Usar repositorio en lugar de servicio
            const variantToUpdate = new ProductVariant();
            // No asignar ID aquí, se pasa como primer argumento a update
            variantToUpdate.name = variantDto.name ?? ''; // Asignar valor por defecto si es undefined
            variantToUpdate.price = variantDto.price ?? 0; // Asignar valor por defecto si es undefined
            variantToUpdate.isActive = variantDto.isActive ?? true; // Asignar valor por defecto si es undefined
            // No necesitamos productId aquí para la actualización parcial
            await this.productVariantRepository.update(variantDto.id, variantToUpdate);
            processedVariantIds.push(variantDto.id);
          } else {
            // Advertir si se intenta actualizar una variante que no pertenece al producto
            console.warn(
              `Variant with ID ${variantDto.id} provided for update but does not belong to product ${id}. Skipping.`,
            );
          }
        } else {
          // Crear nueva variante
          // Usar repositorio en lugar de servicio
          const variantToCreate = new ProductVariant();
          variantToCreate.productId = id; // Asociar al producto actual
          variantToCreate.name = variantDto.name || '';
          variantToCreate.price = variantDto.price || 0;
          variantToCreate.isActive = variantDto.isActive ?? true;
          const newVariant = await this.productVariantRepository.create(variantToCreate);
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
}
