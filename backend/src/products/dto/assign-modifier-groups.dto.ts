import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignModifierGroupsDto {
  @ApiProperty({
    type: [String],
    example: [
      'MODGRP-1',
      'MODGRP-2',
    ],
    description: 'IDs de los grupos de modificadores a asignar al producto',
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  modifierGroupIds: string[];
}
