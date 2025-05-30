import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from '../domain/enums/payment-method.enum';
import { PaymentStatus } from '../domain/enums/payment-status.enum';

export class FindAllPaymentsDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la orden asociada al pago',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Método de pago',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    description: 'Estado del pago',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
