import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateModifierGroupDto {
  @ApiProperty({
    type: String,
    example: 'Tamaños',
    description: 'Nombre del grupo de modificadores',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

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
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Número máximo de selecciones',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el grupo de modificadores es requerido',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si se permiten múltiples selecciones',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleSelections?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si el grupo de modificadores está activo',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
