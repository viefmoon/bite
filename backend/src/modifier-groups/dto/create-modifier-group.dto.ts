import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateModifierGroupDto {
  @ApiProperty({
    type: String,
    example: 'Tamaños',
    description: 'Nombre del grupo de modificadores',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Selecciona el tamaño de tu bebida',
    description: 'Descripción del grupo de modificadores',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Número mínimo de selecciones',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Número máximo de selecciones',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  maxSelections: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el grupo de modificadores es requerido',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si se permiten múltiples selecciones',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowMultipleSelections?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si el grupo de modificadores está activo',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
