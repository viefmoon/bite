import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemModifierDto {
  @ApiProperty({
    description: 'ID del ProductModifier seleccionado (la opción específica)',
    example: 'MOD-1',
  })
  @IsNotEmpty()
  @IsString()
  productModifierId: string;

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
