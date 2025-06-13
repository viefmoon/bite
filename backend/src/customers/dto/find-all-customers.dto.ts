import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { PaginationParams } from '../../utils/types/pagination-params'; // Asumiendo que tienes un DTO base para paginación

export class FindAllCustomersDto extends PaginationParams {
  // Extender de PaginationParams si existe
  @ApiPropertyOptional({
    description:
      'Filtrar por nombre (búsqueda parcial, insensible a mayúsculas)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por apellido (búsqueda parcial, insensible a mayúsculas)',
    example: 'Perez',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por correo electrónico exacto',
    example: 'juan.perez@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por número de teléfono exacto',
    example: '+525512345678',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'El número de teléfono no es válido' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por última interacción después de esta fecha',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  lastInteractionAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de baneo',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}
