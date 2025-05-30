import { ApiPropertyOptional } from '@nestjs/swagger'; 
import { IsBoolean, IsOptional, IsString } from 'class-validator'; 
import { Transform } from 'class-transformer'; 

export class FindAllCategoriesDto {
  @ApiPropertyOptional({ example: 'Bebidas' }) 
  @IsOptional()
  @IsString() 
  name?: string; 

  @ApiPropertyOptional({ 
    type: Boolean,
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}
