import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}

export class FinalizeOrdersDto {
  @ApiProperty({
    description: 'Lista de IDs de órdenes a finalizar',
    type: [String],
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  orderIds: string[];

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Notas adicionales para la finalización',
    required: false,
    example: 'Entregado por conductor John',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}