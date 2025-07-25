import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class CreateTableDto {
  @ApiProperty({
    type: String,
    example: 'Mesa 1',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: 'AREA-1',
    description: 'ID del área a la que pertenece la mesa (obligatorio)',
  })
  @IsNotEmpty()
  @IsString()
  areaId: string;

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
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    required: false,
    default: false,
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
