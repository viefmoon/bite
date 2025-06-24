import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransformDefault } from '../../utils/transformers/transform-default.decorator';

export class CreateSubcategoryDto {
  @ApiProperty({
    type: String,
    example: 'Smartphones',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Teléfonos inteligentes y accesorios',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: true, // Keep for Swagger documentation clarity
  })
  @TransformDefault(true) // Apply default value if undefined
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: String,
    example: 'CAT-1',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  photoId?: string;

  @ApiProperty({
    type: Number,
    example: 0,
    default: 0,
  })
  @TransformDefault(0)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
