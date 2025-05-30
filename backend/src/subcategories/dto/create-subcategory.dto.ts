import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  photoId?: string;
}
