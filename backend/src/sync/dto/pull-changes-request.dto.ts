import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID } from 'class-validator';

export class PullChangesRequestDto {
  @ApiPropertyOptional({
    description: 'IDs de órdenes procesadas exitosamente en el pull anterior',
    example: ['order_123', 'order_456'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  confirmedOrderIds?: string[];

  @ApiPropertyOptional({
    description: 'IDs de clientes procesados exitosamente en el pull anterior',
    example: ['customer_789', 'customer_012'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  confirmedCustomerIds?: string[];
}
