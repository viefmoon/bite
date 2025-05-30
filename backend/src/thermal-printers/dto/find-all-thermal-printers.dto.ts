import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PrinterConnectionType } from '../domain/thermal-printer';

export class FindAllThermalPrintersDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Número de página',
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Número de elementos por página',
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    type: String,
    example: 'Cocina',
    description: 'Filtrar por nombre (búsqueda parcial)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: PrinterConnectionType,
    example: PrinterConnectionType.NETWORK,
    description: 'Filtrar por tipo de conexión',
  })
  @IsOptional()
  @IsEnum(PrinterConnectionType)
  connectionType?: PrinterConnectionType;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Filtrar por estado activo/inactivo',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
