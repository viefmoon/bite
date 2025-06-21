import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreatePizzaCustomizationDto } from './create-pizza-customization.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePizzaCustomizationDto extends PartialType(
  CreatePizzaCustomizationDto,
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}