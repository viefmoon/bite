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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FindAllCustomersDto } from './dto/find-all-customers.dto';
import { BanCustomerDto } from './dto/ban-customer.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Customer } from './domain/customer';

@ApiTags('Customers')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all customers' })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindAllCustomersDto): Promise<Customer[]> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.customersService.remove(id);
  }

  // Chat History endpoints

  @Post(':id/chat-message')
  @ApiOperation({ summary: 'Append a message to customer chat history' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['user', 'assistant', 'system'] },
        content: { type: 'string' },
      },
      required: ['role', 'content'],
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  appendChatMessage(
    @Param('id') id: string,
    @Body() message: { role: 'user' | 'assistant' | 'system'; content: string },
  ): Promise<Customer> {
    return this.customersService.appendToChatHistory(id, message);
  }

  @Patch(':id/relevant-chat-history')
  @ApiOperation({ summary: 'Update relevant chat history for a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        relevantHistory: { type: 'array', items: { type: 'object' } },
      },
      required: ['relevantHistory'],
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  updateRelevantHistory(
    @Param('id') id: string,
    @Body() body: { relevantHistory: any[] },
  ): Promise<Customer> {
    return this.customersService.updateRelevantChatHistory(
      id,
      body.relevantHistory,
    );
  }

  @Patch(':id/stats')
  @ApiOperation({ summary: 'Update customer statistics' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        totalSpent: { type: 'number' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  updateStats(
    @Param('id') id: string,
    @Body() stats: { totalOrders?: number; totalSpent?: number },
  ): Promise<Customer> {
    return this.customersService.updateCustomerStats(id, stats);
  }

  @Get('active/recent')
  @ApiOperation({ summary: 'Get active customers with recent interactions' })
  @ApiParam({
    name: 'daysAgo',
    required: false,
    description: 'Number of days to look back (default: 30)',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  getActiveWithRecentInteraction(
    @Query('daysAgo') daysAgo?: number,
  ): Promise<Customer[]> {
    const days = daysAgo ? Number(daysAgo) : 30;
    return this.customersService.getActiveCustomersWithRecentInteraction(days);
  }

  // Ban/Unban endpoints

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  banCustomer(
    @Param('id') id: string,
    @Body() banCustomerDto: BanCustomerDto,
  ): Promise<Customer> {
    return this.customersService.banCustomer(id, banCustomerDto.banReason);
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'Unban a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  unbanCustomer(@Param('id') id: string): Promise<Customer> {
    return this.customersService.unbanCustomer(id);
  }

  @Get('banned/list')
  @ApiOperation({ summary: 'Get all banned customers' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  getBannedCustomers(): Promise<Customer[]> {
    return this.customersService.getBannedCustomers();
  }
}
