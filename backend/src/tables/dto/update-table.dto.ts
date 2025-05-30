import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsInt,
} from 'class-validator';

export class UpdateTableDto {
  @ApiProperty({
    type: String,
    example: 'Mesa 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiProperty({
    type: Number,
    example: 4,
    required: false,
    description: 'Capacidad de la mesa (opcional)',
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  capacity?: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isTemporary?: boolean;

  @ApiProperty({
    type: String,
    example: 'T-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  temporaryIdentifier?: string;
}
