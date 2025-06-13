import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BanCustomerDto {
  @ApiProperty({
    description: 'Razón por la cual se está baneando al cliente',
    example: 'Comportamiento inapropiado con el personal del restaurante',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  banReason: string;
}
