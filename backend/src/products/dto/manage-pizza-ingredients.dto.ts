import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ManagePizzaIngredientsDto {
  @ApiProperty({
    description: 'Array of pizza ingredient IDs to associate/update',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  pizzaIngredientIds: string[];
}
