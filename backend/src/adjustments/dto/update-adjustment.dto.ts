import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateAdjustmentDto } from './create-adjustment.dto';

export class UpdateAdjustmentDto extends PartialType(CreateAdjustmentDto) {
  @ApiPropertyOptional()
  id?: string;
}
