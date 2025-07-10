import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { PaymentMethod } from '../domain/enums/payment-method.enum';

export class CreatePrepaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Método de pago',
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    type: Number,
    example: 177.59,
    description: 'Monto del pago',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
