import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class FindAllProductModifiersDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Filtrar por ID del grupo de modificadores',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty({
    type: String,
    example: 'Grande',
    description: 'Filtrar por nombre (búsqueda parcial)',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Filtrar por estado activo/inactivo',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Filtrar por modificadores por defecto',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
