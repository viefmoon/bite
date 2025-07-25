import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../../orders/domain/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'ID del pedido a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Nuevo estado del pedido',
    enum: OrderStatus,
    example: OrderStatus.IN_PROGRESS,
  })
  @IsEnum(OrderStatus)
  newStatus: OrderStatus;
}
