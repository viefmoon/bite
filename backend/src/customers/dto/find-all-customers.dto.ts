import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllCustomersDto extends PaginationParams {
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
    description: 'Filtrar por número de WhatsApp exacto',
    example: '+525512345678',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'El número de WhatsApp no es válido' })
  whatsappPhoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
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
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isBanned?: boolean;
}
