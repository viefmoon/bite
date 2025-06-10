import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityUpdateDto,
  BulkAvailabilityUpdateDto,
} from './dto/availability-update.dto';
import {
  CategoryAvailabilityDto,
  ModifierGroupAvailabilityDto,
} from './dto/menu-availability.dto';

@ApiTags('Availability')
@Controller({
  path: 'availability',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('menu')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get menu availability status' })
  @ApiResponse({
    status: 200,
    description: 'Menu availability retrieved successfully',
    type: [CategoryAvailabilityDto],
  })
  async getMenuAvailability(): Promise<CategoryAvailabilityDto[]> {
    return this.availabilityService.getMenuAvailability();
  }

  @Get('modifier-groups')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get modifier groups availability status' })
  @ApiResponse({
    status: 200,
    description: 'Modifier groups availability retrieved successfully',
    type: [ModifierGroupAvailabilityDto],
  })
  async getModifierGroupsAvailability(): Promise<
    ModifierGroupAvailabilityDto[]
  > {
    return this.availabilityService.getModifierGroupsAvailability();
  }

  @Patch('update')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Update availability for a single entity' })
  @ApiResponse({
    status: 200,
    description: 'Availability updated successfully',
  })
  async updateAvailability(@Body() dto: AvailabilityUpdateDto): Promise<void> {
    return this.availabilityService.updateAvailability(dto);
  }

  @Patch('bulk-update')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Bulk update availability for multiple entities' })
  @ApiResponse({
    status: 200,
    description: 'Availability updated successfully',
  })
  async bulkUpdateAvailability(
    @Body() dto: BulkAvailabilityUpdateDto,
  ): Promise<void> {
    return this.availabilityService.bulkUpdateAvailability(dto.updates);
  }
}
