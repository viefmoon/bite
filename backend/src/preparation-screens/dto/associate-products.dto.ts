import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssociateProductsDto {
  @ApiProperty({
    description:
      'IDs de los productos a asociar con la pantalla de preparación',
    example: ['PROD-1'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  productIds: string[];
}
