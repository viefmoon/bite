import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllAddressesDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por ID del cliente (generalmente inyectado desde el parámetro de ruta)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por si es la dirección predeterminada',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por código postal',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por ciudad (búsqueda parcial, insensible a mayúsculas)',
    example: 'Ejemplo',
  })
  @IsOptional()
  @IsString()
  city?: string;
}
