import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateSubcategoryDto {
  @ApiProperty({
    type: String,
    example: 'Smartphones',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: String,
    example: 'Teléfonos inteligentes y accesorios',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: String,
    example: 'CAT-1',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.photoId !== null)
  @IsString()
  photoId?: string | null;

  @ApiProperty({
    type: Number,
    example: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
