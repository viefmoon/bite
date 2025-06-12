import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreatePizzaIngredientDto {
  @ApiProperty({
    type: String,
    description: 'Name of the pizza ingredient',
    example: 'Pepperoni',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: Number,
    description: 'Value of the ingredient',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ingredientValue?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'ID of the product this ingredient belongs to',
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'List of ingredients or additional information',
    example: 'Pork, beef, spices',
  })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Whether the ingredient is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
