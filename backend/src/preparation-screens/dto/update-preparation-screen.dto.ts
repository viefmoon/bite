import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdatePreparationScreenDto {
  @ApiProperty({
    type: String,
    example: 'Cocina Principal',
    description: 'Nombre de la pantalla de preparación',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

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
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: [String],
    example: ['PROD-1', 'PROD-2'],
    description:
      'IDs de los productos asociados a esta pantalla. Reemplaza la lista existente.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiProperty({
    type: String,
    example: 'b88a9f9a-8e8e-4b7d-8c5e-5d5f1f2a3b4c',
    description: 'ID del usuario con rol de cocina asignado a esta pantalla',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  userId?: string;
}
