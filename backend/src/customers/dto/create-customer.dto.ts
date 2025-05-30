import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from './create-address.dto';

export class CreateCustomerDto {
  @ApiProperty({
    type: String,
    example: 'Juan',
    description: 'Nombre del cliente',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    type: String,
    example: 'Pérez',
    description: 'Apellido del cliente',
  })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    type: String,
    example: '+525512345678',
    description: 'Número de teléfono del cliente (opcional)',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'El número de teléfono no es válido' })
  phoneNumber?: string;

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
    type: () => [CreateAddressDto],
    description: 'Lista de direcciones iniciales para el cliente (opcional)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses?: CreateAddressDto[];
}
