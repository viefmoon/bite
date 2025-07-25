import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusResponseDto {
  @ApiProperty({
    description: 'Indica si la actualización fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Estado del pedido actualizado correctamente',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp de cuando se realizó la actualización',
    example: '2024-01-15T12:03:00Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Indica si se notificó al cliente por WhatsApp',
    example: true,
  })
  customerNotified: boolean;
}
