import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CustomizationType } from '../domain/enums/customization-type.enum';

export class FindAllPizzaCustomizationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: CustomizationType,
    example: CustomizationType.INGREDIENT,
    description: 'Filter by customization type',
  })
  @IsOptional()
  @IsEnum(CustomizationType)
  type?: CustomizationType;
}
