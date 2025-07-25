import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class RestaurantDataQueryDto {
  @ApiPropertyOptional({
    description:
      'Devolver datos solo si fueron modificados después de esta fecha',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  if_modified_since?: string;
}
