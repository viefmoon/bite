import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderType } from '../../orders/domain/enums/order-type.enum';

export class KitchenOrderFilterDto {
  @ApiProperty({
    enum: OrderType,
    description: 'Filtrar por tipo de orden',
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiProperty({
    type: Boolean,
    description: 'Mostrar órdenes con productos preparados',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  showPrepared?: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Mostrar todos los productos (no solo de mi pantalla)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  showAllProducts?: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Desagrupar productos idénticos',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  ungroupProducts?: boolean;

  @ApiProperty({
    type: String,
    description:
      'ID de la pantalla de preparación (opcional, se obtiene del usuario)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  screenId?: string;
}
