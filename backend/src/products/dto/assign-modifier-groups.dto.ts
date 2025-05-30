import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignModifierGroupsDto {
  @ApiProperty({
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    description: 'IDs de los grupos de modificadores a asignar al producto',
  })
  @IsNotEmpty()
  @IsArray()
  @IsUUID(4, { each: true })
  modifierGroupIds: string[];
}
