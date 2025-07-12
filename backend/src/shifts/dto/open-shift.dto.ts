import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class OpenShiftDto {
  @ApiProperty({
    description: 'Efectivo inicial en caja',
    example: 500.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  initialCash: number;

  @ApiProperty({
    description: 'Notas opcionales de apertura',
    example: 'Apertura normal del turno',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Fecha del turno (opcional, por defecto hoy)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
