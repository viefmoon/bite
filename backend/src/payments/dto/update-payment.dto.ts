import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { PaymentMethod } from '../domain/enums/payment-method.enum';
import { PaymentStatus } from '../domain/enums/payment-status.enum';

export class UpdatePaymentDto {
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
    type: Number,
    example: 177.59,
    description: 'Monto del pago',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
    description: 'Estado del pago',
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
