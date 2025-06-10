import { ApiProperty } from '@nestjs/swagger';

export class ModifierAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  modifierGroupId: string;
}

export class ModifierGroupAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [ModifierAvailabilityDto] })
  modifiers: ModifierAvailabilityDto[];
}

export class ProductAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  subcategoryId: string;

  @ApiProperty({ type: [ModifierGroupAvailabilityDto], required: false })
  modifierGroups?: ModifierGroupAvailabilityDto[];
}

export class SubcategoryAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ type: [ProductAvailabilityDto] })
  products: ProductAvailabilityDto[];
}

export class CategoryAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [SubcategoryAvailabilityDto] })
  subcategories: SubcategoryAvailabilityDto[];
}
