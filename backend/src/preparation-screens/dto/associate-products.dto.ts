import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AssociateProductsDto {
  @ApiProperty({
    description:
      'IDs de los productos a asociar con la pantalla de preparación',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  @Type(() => String)
  productIds: string[];
}
