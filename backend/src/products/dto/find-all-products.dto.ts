import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllProductsDto {
  @ApiProperty({
    type: Number,
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({
    type: Number,
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiProperty({
    type: String,
    example: 'SUBCAT-1',
    description: 'Filtrar por ID de subcategoría',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Filtrar por productos con variantes',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasVariants?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Filtrar por productos activos',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiProperty({
    type: String,
    example: 'Hamburguesa',
    description: 'Buscar por nombre del producto',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
