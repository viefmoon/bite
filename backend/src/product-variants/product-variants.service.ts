import { Inject, Injectable } from '@nestjs/common';
import { ProductVariantRepository } from './infrastructure/persistence/product-variant.repository';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariant } from './domain/product-variant';
import { FindAllProductVariantsDto } from './dto/find-all-product-variants.dto';
import { PRODUCT_VARIANT_REPOSITORY } from '../common/tokens';

@Injectable()
export class ProductVariantsService {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  async create(
    createProductVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const productVariant = new ProductVariant();
    productVariant.productId = createProductVariantDto.productId;
    productVariant.name = createProductVariantDto.name;
    productVariant.price = createProductVariantDto.price;
    productVariant.isActive = createProductVariantDto.isActive ?? true;

    return this.productVariantRepository.create(productVariant);
  }

  async findAll(
    findAllProductVariantsDto: FindAllProductVariantsDto,
  ): Promise<[ProductVariant[], number]> {
    return this.productVariantRepository.findAll({
      page: findAllProductVariantsDto.page || 1,
      limit: findAllProductVariantsDto.limit || 10,
      productId: findAllProductVariantsDto.productId,
      isActive: findAllProductVariantsDto.isActive,
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    return this.productVariantRepository.findOne(id);
  }

  async findAllByProductId(productId: string): Promise<ProductVariant[]> {
    return this.productVariantRepository.findAllByProductId(productId);
  }

  async update(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const existingProductVariant =
      await this.productVariantRepository.findOne(id);

    const productVariant = new ProductVariant();
    productVariant.id = id;
    productVariant.productId =
      updateProductVariantDto.productId ?? existingProductVariant.productId;
    productVariant.name =
      updateProductVariantDto.name ?? existingProductVariant.name;
    productVariant.price =
      updateProductVariantDto.price ?? existingProductVariant.price;
    productVariant.isActive =
      updateProductVariantDto.isActive ?? existingProductVariant.isActive;

    return this.productVariantRepository.update(id, productVariant);
  }

  async remove(id: string): Promise<void> {
    return this.productVariantRepository.softDelete(id);
  }
}
