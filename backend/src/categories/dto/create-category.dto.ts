import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransformDefault } from '../../utils/transformers/transform-default.decorator';

export class CreateCategoryDto {
  @ApiProperty({
    type: String,
    example: 'Bebidas',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Bebidas sin alcohol',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: true,
  })
  @TransformDefault(true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  photoId?: string;
}
