import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class PrintOrderDto {
  @ApiProperty({
    description: 'ID de la orden a imprimir',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({
    description: 'ID de la impresora térmica a utilizar (opcional)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  printerId?: string;
}
