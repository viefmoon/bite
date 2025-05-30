import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductModifier } from './domain/product-modifier';
import { CreateProductModifierDto } from './dto/create-product-modifier.dto';
import { FindAllProductModifiersDto } from './dto/find-all-product-modifiers.dto';
import { UpdateProductModifierDto } from './dto/update-product-modifier.dto';
import { IProductModifierRepository } from './infrastructure/persistence/product-modifier.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { PRODUCT_MODIFIER_REPOSITORY } from '../common/tokens';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class ProductModifiersService {
  constructor(
    @Inject(PRODUCT_MODIFIER_REPOSITORY)
    private readonly productModifierRepository: IProductModifierRepository,
  ) {}

  async create(
    createProductModifierDto: CreateProductModifierDto,
  ): Promise<ProductModifier> {
    const productModifier = new ProductModifier();
    productModifier.groupId = createProductModifierDto.groupId;
    productModifier.name = createProductModifierDto.name;
    productModifier.description =
      createProductModifierDto.description !== undefined
        ? createProductModifierDto.description
        : null;
    productModifier.price =
      createProductModifierDto.price !== undefined
        ? createProductModifierDto.price
        : null;
    productModifier.sortOrder =
      createProductModifierDto.sortOrder !== undefined
        ? createProductModifierDto.sortOrder
        : 0;
    productModifier.isDefault =
      createProductModifierDto.isDefault !== undefined
        ? createProductModifierDto.isDefault
        : false;
    productModifier.isActive =
      createProductModifierDto.isActive !== undefined
        ? createProductModifierDto.isActive
        : true;

    return this.productModifierRepository.create(productModifier);
  }

  async findAll(
    filterOptions: FindAllProductModifiersDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Paginated<ProductModifier>> {
    return this.productModifierRepository.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
  }

  async findOne(id: string): Promise<ProductModifier> {
    const productModifier = await this.productModifierRepository.findById(id);

    if (!productModifier) {
      throw new NotFoundException(`Product modifier with ID ${id} not found`);
    }

    return productModifier;
  }

  async findByGroupId(groupId: string): Promise<ProductModifier[]> {
    return this.productModifierRepository.findByGroupId(groupId);
  }

  async update(
    id: string,
    updateProductModifierDto: UpdateProductModifierDto,
  ): Promise<ProductModifier> {
    const updatedProductModifier = await this.productModifierRepository.update(
      id,
      updateProductModifierDto,
    );

    if (!updatedProductModifier) {
       throw new NotFoundException(`Product modifier with ID ${id} not found`);
    }

    return updatedProductModifier;
  }

  async remove(id: string): Promise<void> {
    await this.productModifierRepository.remove(id);
  }
}
