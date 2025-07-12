import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CloseShiftDto {
  @ApiProperty({
    description: 'Efectivo final contado en caja',
    example: 2500.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  finalCash: number;

  @ApiProperty({
    description: 'Notas opcionales de cierre',
    example: 'Cierre sin novedades, todo cuadra',
    required: false,
  })
  @IsOptional()
  @IsString()
  closeNotes?: string;
}
