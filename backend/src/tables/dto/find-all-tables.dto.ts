import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllTablesDto {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Capacidad de la mesa (opcional)',
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return Number(value);
  })
  capacity?: number;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isTemporary?: boolean;
}
