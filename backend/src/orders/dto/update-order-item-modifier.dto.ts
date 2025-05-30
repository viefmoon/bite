import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderItemModifierDto {
  @ApiPropertyOptional({
    description: 'ID del ProductModifier asociado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
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
