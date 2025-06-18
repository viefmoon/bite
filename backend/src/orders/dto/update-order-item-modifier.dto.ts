import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderItemModifierDto {
  @ApiPropertyOptional({
    description: 'ID del ProductModifier seleccionado (la opción específica)',
    example: 'MOD-1',
  })
  @IsOptional()
  @IsString()
  productModifierId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad del modificador',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Precio del modificador (opcional)',
    example: 2.5,
    nullable: true,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;
}
