import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessHoursDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Día de la semana (0 = Domingo, 1 = Lunes, ... 6 = Sábado)',
  })
  dayOfWeek: number;

  @ApiPropertyOptional({
    type: String,
    example: '09:00',
    description: 'Hora de apertura en formato HH:mm (null si está cerrado)',
    nullable: true,
  })
  openingTime: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '22:00',
    description: 'Hora de cierre en formato HH:mm (null si está cerrado)',
    nullable: true,
  })
  closingTime: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el restaurante está cerrado ese día',
  })
  isClosed: boolean;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la configuración del restaurante',
  })
  restaurantConfigId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
