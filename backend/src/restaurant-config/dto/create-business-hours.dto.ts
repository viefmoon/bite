import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  Matches,
} from 'class-validator';

export class CreateBusinessHoursDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Día de la semana (0 = Domingo, 1 = Lunes, ... 6 = Sábado)',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    type: String,
    example: '09:00',
    description: 'Hora de apertura en formato HH:mm (null si está cerrado)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openingTime debe estar en formato HH:mm',
  })
  openingTime?: string | null;

  @ApiProperty({
    type: String,
    example: '22:00',
    description: 'Hora de cierre en formato HH:mm (null si está cerrado)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closingTime debe estar en formato HH:mm',
  })
  closingTime?: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el restaurante está cerrado ese día',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la configuración del restaurante',
  })
  @IsUUID()
  restaurantConfigId: string;
}
