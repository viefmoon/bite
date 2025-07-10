import {
  Controller,
  Get,
  Body,
  Put,
  UseGuards,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { RestaurantConfigService } from './restaurant-config.service';
import { UpdateRestaurantConfigDto } from './dto/update-restaurant-config.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RestaurantConfigDto } from './dto/restaurant-config.dto';

@ApiTags('Restaurant Config')
@Controller({
  path: 'restaurant-config',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RestaurantConfigController {
  constructor(
    private readonly restaurantConfigService: RestaurantConfigService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @Roles(
    RoleEnum.admin,
    RoleEnum.manager,
    RoleEnum.cashier,
    RoleEnum.waiter,
    RoleEnum.kitchen,
    RoleEnum.delivery,
  )
  @ApiOkResponse({
    type: RestaurantConfigDto,
  })
  @HttpCode(HttpStatus.OK)
  async getConfig(): Promise<RestaurantConfigDto> {
    return this.restaurantConfigService.getConfig();
  }

  @Put()
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @ApiOkResponse({
    type: RestaurantConfigDto,
  })
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({
    groups: ['admin'],
  })
  async updateConfig(
    @Body() updateRestaurantConfigDto: UpdateRestaurantConfigDto,
  ): Promise<RestaurantConfigDto> {
    return this.restaurantConfigService.updateConfig(updateRestaurantConfigDto);
  }
}
