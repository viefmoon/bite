import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProductModifierDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del grupo de modificadores al que pertenece',
  })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @ApiProperty({
    type: String,
    example: 'Grande',
    description: 'Nombre del modificador',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'Tamaño grande de 500ml',
    description: 'Descripción del modificador',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 10.5,
    description: 'Precio adicional del modificador',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Orden de visualización',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si este modificador es seleccionado por defecto',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si el modificador está activo',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
