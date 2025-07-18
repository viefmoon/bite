import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/domain/order';
import { Customer } from '../../customers/domain/customer';

export class PullChangesResponseDto {
  @ApiProperty({
    type: [Order],
    description: 'Lista de pedidos pendientes de sincronización',
  })
  pending_orders: Order[];

  @ApiProperty({
    type: [Customer],
    description: 'Lista de clientes actualizados pendientes de sincronización',
  })
  updated_customers: Customer[];
}