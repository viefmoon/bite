import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsDateString,
  IsBoolean,
  IsArray,
  IsObject,
  IsNumber,
  Min,
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

  @ApiPropertyOptional({
    type: String,
    example: '1990-01-15',
    description: 'Fecha de nacimiento del cliente',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

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
    type: 'array',
    description:
      'Historial completo de chat (para actualizaciones específicas)',
  })
  @IsOptional()
  @IsArray()
  fullChatHistory?: any[];

  @ApiPropertyOptional({
    type: 'array',
    description: 'Historial relevante de chat',
  })
  @IsOptional()
  @IsArray()
  relevantChatHistory?: any[];

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Última interacción con el cliente',
  })
  @IsOptional()
  @IsDateString()
  lastInteraction?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 5,
    description: 'Contador de mensajes de WhatsApp enviados por el cliente',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  whatsappMessageCount?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha y hora del último mensaje de WhatsApp recibido',
  })
  @IsOptional()
  @IsDateString()
  lastWhatsappMessageTime?: string;
}
