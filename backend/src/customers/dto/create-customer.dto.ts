import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsDateString,
  IsBoolean,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from './create-address.dto';

export class CreateCustomerDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Juan',
    description: 'Nombre del cliente (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Pérez',
    description: 'Apellido del cliente (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    type: String,
    example: '+525512345678',
    description: 'Número de teléfono del cliente (obligatorio)',
  })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
  @IsPhoneNumber(undefined, { message: 'El número de teléfono no es válido' })
  phoneNumber: string;

  @ApiPropertyOptional({
    type: String,
    example: '+525587654321',
    description: 'Número de WhatsApp del cliente (opcional, debe ser único)',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'El número de WhatsApp no es válido' })
  whatsappPhoneNumber?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'juan.perez@example.com',
    description: 'Correo electrónico del cliente (opcional, debe ser único)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    type: String,
    example: '1990-01-15',
    description: 'Fecha de nacimiento del cliente',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Indica si el cliente está activo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Indica si el cliente está baneado',
  })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @ApiPropertyOptional({
    type: () => [CreateAddressDto],
    description: 'Lista de direcciones iniciales para el cliente (opcional)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses?: CreateAddressDto[];
}
