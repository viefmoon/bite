import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CustomizationType } from '../domain/enums/customization-type.enum';

export class CreatePizzaCustomizationDto {
  @ApiProperty({ example: 'PEPPERONI' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ example: 'Pepperoni' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: CustomizationType,
    example: CustomizationType.INGREDIENT,
    description: 'Type of customization: FLAVOR or INGREDIENT',
  })
  @IsEnum(CustomizationType)
  type: CustomizationType;

  @ApiProperty({
    example: 'Jamón, piña, queso mozzarella',
    description: 'Description of ingredients for FLAVOR type',
    required: false,
  })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiProperty({
    example: 1,
    description: 'How much this counts towards the topping limit',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  toppingValue?: number;

  @ApiProperty({
    example: 0,
    description: 'Sort order for display',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
