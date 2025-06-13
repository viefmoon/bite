import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PizzaIngredientUpdate {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID del producto pizza',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    description: 'IDs de los ingredientes seleccionados para esta pizza',
  })
  @IsArray()
  @IsString({ each: true })
  ingredientIds: string[];
}

export class BulkUpdatePizzaIngredientsDto {
  @ApiProperty({
    type: [PizzaIngredientUpdate],
    description: 'Lista de actualizaciones de ingredientes por pizza',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PizzaIngredientUpdate)
  updates: PizzaIngredientUpdate[];
}
