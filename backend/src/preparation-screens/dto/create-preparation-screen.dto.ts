import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePreparationScreenDto {
  @ApiProperty({
    type: String,
    example: 'Cocina Principal',
    description: 'Nombre de la pantalla de preparación',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'Pantalla para preparación de platos principales',
    description: 'Descripción de la pantalla de preparación (opcional)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si la pantalla está activa',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: [String],
    example: ['PROD-1', 'PROD-2'],
    description: 'IDs de los productos asociados a esta pantalla',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
