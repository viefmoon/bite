import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductRepository } from '../../product.repository';
import { Product } from '../../../../domain/product';
import { ProductMapper } from '../mappers/product.mapper';
import { Paginated } from '../../../../../common/types/paginated.type';

@Injectable()
export class ProductRelationalRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly productMapper: ProductMapper,
  ) {}

  async create(product: Product): Promise<Product> {
    const entity = this.productMapper.toEntity(product);
    if (!entity) {
      throw new InternalServerErrorException('Error creating product entity');
    }
    const savedEntity = await this.productRepository.save(entity);
    const domainResult = this.productMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping saved product entity to domain',
      );
    }
    return domainResult;
  }

  async findAll(options: {
    page: number;
    limit: number;
    subcategoryId?: string;
    hasVariants?: boolean;
    isActive?: boolean;
    search?: string;
  }): Promise<Paginated<Product>> {
    const where: any = {};

    if (options.subcategoryId) {
      where.subcategory = { id: options.subcategoryId };
    }

    if (options.hasVariants !== undefined) {
      where.hasVariants = options.hasVariants;
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.search) {
      where.name = ILike(`%${options.search}%`);
    }

    const [entities, count] = await this.productRepository.findAndCount({
      where,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: [
        'photo',
        'subcategory',
        'variants',
        'modifierGroups',
        'modifierGroups.productModifiers',
        'preparationScreen',
      ],
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });

    const products = entities
      .map((entity) => this.productMapper.toDomain(entity))
      .filter((item): item is Product => item !== null);

    return new Paginated(products, count, options.page, options.limit);
  }

  async findOne(id: string): Promise<Product> {
    const entity = await this.productRepository.findOne({
      where: { id },
      relations: [
        'photo',
        'subcategory',
        'variants',
        'modifierGroups',
        'modifierGroups.productModifiers',
        'preparationScreen',
      ],
    });

    if (!entity) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    const domainResult = this.productMapper.toDomain(entity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping found product entity to domain',
      );
    }
    return domainResult;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const entities = await this.productRepository.find({
      where: { id: In(ids) },
    });
    return entities
      .map((entity) => this.productMapper.toDomain(entity))
      .filter((item): item is Product => item !== null);
  }

  async update(
    id: string,
    productUpdatePayload: Partial<Product>,
  ): Promise<Product | null> {
    const entity = this.productMapper.toEntity(productUpdatePayload as Product);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating product entity for update',
      );
    }

    const updateResult = await this.productRepository.update(id, entity);

    if (updateResult.affected === 0) {
      return null;
    }

    const updatedEntity = await this.productRepository.findOne({
      where: { id },
      relations: [
        'photo',
        'subcategory',
        'variants',
        'modifierGroups',
        'modifierGroups.productModifiers',
        'preparationScreen',
      ],
    });

    if (!updatedEntity) {
      throw new NotFoundException(
        `Producto con ID ${id} no encontrado después de actualizar`,
      );
    }

    const domainResult = this.productMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping updated product entity to domain',
      );
    }
    return domainResult;
  }

  async save(product: Product): Promise<Product> {
    const entity = this.productMapper.toEntity(product);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating product entity for save',
      );
    }
    const savedEntity = await this.productRepository.save(entity);

    const reloadedEntity = await this.productRepository.findOne({
      where: { id: savedEntity.id },
      relations: [
        'photo',
        'subcategory',
        'variants',
        'modifierGroups',
        'modifierGroups.productModifiers',
        'preparationScreen',
      ],
    });
    if (!reloadedEntity) {
      throw new NotFoundException(
        `Producto con ID ${savedEntity.id} no encontrado después de guardar`,
      );
    }
    const domainResult = this.productMapper.toDomain(reloadedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping reloaded product entity to domain',
      );
    }
    return domainResult;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.productRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
  }

  async updatePreparationScreen(
    productId: string,
    preparationScreenId: string,
  ): Promise<void> {
    const result = await this.productRepository.update(productId, {
      preparationScreenId: preparationScreenId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }
  }

  async findOneWithPizzaCustomizations(id: string): Promise<Product | null> {
    const entity = await this.productRepository.findOne({
      where: { id },
      relations: ['pizzaCustomizations'],
    });

    if (!entity) {
      return null;
    }

    const domainResult = this.productMapper.toDomain(entity);
    return domainResult;
  }

  async updatePizzaCustomizations(
    productId: string,
    pizzaCustomizationIds: string[],
  ): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['pizzaCustomizations'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Actualizar las relaciones de pizza customizations
    await this.productRepository
      .createQueryBuilder()
      .relation(ProductEntity, 'pizzaCustomizations')
      .of(product)
      .addAndRemove(
        pizzaCustomizationIds,
        product.pizzaCustomizations.map((pc) => pc.id),
      );
  }

  async findAllPizzas(): Promise<Product[]> {
    const entities = await this.productRepository.find({
      where: { isPizza: true, isActive: true },
      relations: [
        'photo',
        'subcategory',
        'pizzaCustomizations',
        'pizzaConfiguration',
        'variants',
      ],
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });

    return entities
      .map((entity) => this.productMapper.toDomain(entity))
      .filter((item): item is Product => item !== null);
  }
}
