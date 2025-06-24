import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ProductModifierDto {
  @ApiProperty({
    type: String,
    example: 'MOD001',
    description: 'ID del modificador seleccionado',
    minLength: 1,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  modifierId: string;
}
