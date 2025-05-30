import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductVariantRepository } from '../../product-variant.repository';
import { ProductVariant } from '../../../../domain/product-variant';
import { ProductVariantMapper } from '../mappers/product-variant.mapper';

@Injectable()
export class ProductVariantRelationalRepository
  implements ProductVariantRepository
{
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    private readonly productVariantMapper: ProductVariantMapper,
  ) {}

  async create(productVariant: ProductVariant): Promise<ProductVariant> {
    const entity = this.productVariantMapper.toEntity(productVariant);
    if (!entity) {
      throw new Error('Error mapping ProductVariant domain to entity for create');
    }
    // Usar create + save puede ser más explícito sobre la creación de una nueva entidad
    const newEntity = this.productVariantRepository.create(entity);
    const savedEntity = await this.productVariantRepository.save(newEntity);
    const domainResult = this.productVariantMapper.toDomain(savedEntity);
    if (!domainResult) {
      // Si toDomain devuelve null aquí, es un error interno inesperado
      throw new Error('Error mapping saved ProductVariant entity back to domain');
    }
    return domainResult;
  }

  async findAll(options: {
    page: number;
    limit: number;
    productId?: string;
    isActive?: boolean;
  }): Promise<[ProductVariant[], number]> {
    const where: any = {};

    if (options.productId) {
      where.productId = options.productId;
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [entities, count] = await this.productVariantRepository.findAndCount({
      where,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      relations: ['product'],
    });

    const productVariants = entities
      .map((entity) => this.productVariantMapper.toDomain(entity))
      .filter((variant): variant is ProductVariant => variant !== null); // Filtrar nulos
    return [productVariants, count];
  }

  async findOne(id: string): Promise<ProductVariant> {
    const entity = await this.productVariantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!entity) {
      throw new NotFoundException(
        `Variante de producto con ID ${id} no encontrada`,
      );
    }

    const domainResult = this.productVariantMapper.toDomain(entity);
    if (!domainResult) {
      // Si toDomain devuelve null aquí, es un error interno inesperado
      throw new NotFoundException(
        `Error mapping ProductVariant entity with ID ${id} to domain`,
      );
    }
    return domainResult;
  }

  async update(
    id: string,
    productVariant: ProductVariant,
  ): Promise<ProductVariant> {
    // Mapear solo los campos actualizables a un objeto parcial
    const partialEntity = this.productVariantMapper.toEntity(productVariant);
    if (!partialEntity) {
        throw new Error('Error mapping ProductVariant domain to partial entity for update');
    }
    // Eliminar el ID del objeto parcial si está presente, ya que se pasa como primer argumento
    const { id: _, ...updatePayload } = partialEntity;

    const updateResult = await this.productVariantRepository.update(id, updatePayload);

    if (updateResult.affected === 0) {
        throw new NotFoundException(
            `Variante de producto con ID ${id} no encontrada para actualizar`,
        );
    }

    const updatedEntity = await this.productVariantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!updatedEntity) {
      throw new NotFoundException(
        `Variante de producto con ID ${id} no encontrada`,
      );
    }

    const domainResult = this.productVariantMapper.toDomain(updatedEntity);
     if (!domainResult) {
      // Si toDomain devuelve null aquí, es un error interno inesperado
      throw new NotFoundException(
        `Error mapping updated ProductVariant entity with ID ${id} to domain`,
      );
    }
    return domainResult;
  }

  async save(productVariant: ProductVariant): Promise<ProductVariant> {
    const entity = this.productVariantMapper.toEntity(productVariant);
    if (!entity) {
      throw new Error('Error mapping ProductVariant domain to entity for save');
    }
    // save maneja tanto creación como actualización. Asegurémonos que savedEntity es una entidad.
    const savedEntity = await this.productVariantRepository.save(entity);

    // Verificar que savedEntity no sea un array y tenga id (aunque save con una entidad debe devolver una entidad)
    if (!savedEntity || typeof savedEntity !== 'object' || !('id' in savedEntity)) {
        throw new Error('Error saving ProductVariant: unexpected result from repository save');
    }

    const reloadedEntity = await this.productVariantRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['product'],
    });
    if (!reloadedEntity) {
      throw new NotFoundException(
        `Variante con ID ${savedEntity.id} no encontrada después de guardar`,
      );
    }
    const domainResult = this.productVariantMapper.toDomain(reloadedEntity);
    if (!domainResult) {
      // Si toDomain devuelve null aquí, es un error interno inesperado
      throw new NotFoundException(
        `Error mapping reloaded ProductVariant entity with ID ${reloadedEntity.id} to domain`,
      );
    }
    return domainResult;
  }

  async findAllByProductId(productId: string): Promise<ProductVariant[]> {
    const entities = await this.productVariantRepository.find({
      where: { productId },
      relations: ['product'],
    });
    return entities
      .map((entity) => this.productVariantMapper.toDomain(entity))
      .filter((variant): variant is ProductVariant => variant !== null); // Filtrar nulos
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.productVariantRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Variante de producto con ID ${id} no encontrada`,
      );
    }
  }
}
