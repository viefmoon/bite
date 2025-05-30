import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemModifierDto {
  @ApiProperty({
    description: 'ID del ProductModifier asociado',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  productModifierId: string; // Campo principal según la nueva indicación

  @ApiProperty({
    description: 'Cantidad del modificador',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity? = 1;

  @ApiProperty({
    description: 'Precio del modificador (opcional)',
    example: 2.5,
    required: false,
    nullable: true,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number | null;
}
