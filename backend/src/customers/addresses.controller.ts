import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAllAddressesDto } from './dto/find-all-addresses.dto';
import { AddressesService } from './addresses.service';
import { RoleEnum } from '../roles/roles.enum';
import { Roles } from '../roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Addresses')
@Controller({ path: 'addresses', version: '1' })
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAddressDto: CreateAddressDto): Promise<Address> {
    return this.addressesService.create(createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all addresses' })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindAllAddressesDto): Promise<Address[]> {
    return this.addressesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<Address> {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const result = await this.addressesService.update(id, updateAddressDto);
    if (!result) {
      throw new Error('Failed to update address');
    }
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.addressesService.remove(id);
  }
}
