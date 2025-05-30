import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Juan',
    description: 'Nombre del cliente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Pérez',
    description: 'Apellido del cliente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+525512345678',
    description: 'Número de teléfono del cliente',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'El número de teléfono no es válido' })
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'juan.perez@example.com',
    description: 'Correo electrónico del cliente (debe ser único)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(255)
  email?: string | null;
}
