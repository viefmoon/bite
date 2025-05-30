import { ApiPropertyOptional } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  MinLength,
  IsEnum,
  IsISO8601,
  IsString,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { RoleDto } from '../../roles/dto/role.dto';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { GenderEnum } from '../enums/gender.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ example: 'johndoe', type: String })
  @IsOptional()
  @IsEmail() 
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'John', type: String })
  @IsOptional()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @IsOptional()
  lastName?: string | null;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsISO8601()
  @Transform(({ value }) => (value ? new Date(value) : null))
  birthDate?: Date | null;

  @ApiPropertyOptional({ enum: GenderEnum, enumName: 'GenderEnum' })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum | null;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string | null;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string | null;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string | null;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string | null;

  @ApiPropertyOptional({
    example: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '+1987654321',
    },
  })
  @IsOptional()
  @IsObject()
  emergencyContact?: Record<string, any> | null;


  @ApiPropertyOptional({ type: () => RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto | null;


  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
