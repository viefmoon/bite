import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class RecoverOrderDto {
  @ApiProperty({
    description: 'Lista de IDs de órdenes a recuperar o finalizar',
    type: [String],
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  orderIds: string[];

  @ApiProperty({
    description: 'Notas adicionales para la operación',
    required: false,
    example: 'Recuperado por solicitud del cliente',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}