import {
  Transform,
  Type,
} from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
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

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ example: 'johndoe', type: String })
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'John', type: String })
  @IsNotEmpty()
  firstName: string | null;

  @ApiProperty({ example: 'Doe', type: String })
  @IsNotEmpty()
  lastName: string | null;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @ApiPropertyOptional({ enum: GenderEnum, enumName: 'GenderEnum' })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    example: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '1987654321',
    },
  })
  @IsOptional()
  @IsObject()
  emergencyContact?: Record<string, any>;

  @ApiProperty({ type: RoleDto })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @Type(() => RoleDto)
  role: RoleDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
