import {
  DefaultValuePipe,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { Order } from './domain/order';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  OrderChangeLogService,
  EnrichedOrderHistoryDto,
} from './order-change-log.service';
import {
  InfinityPaginationResponseDto,
  InfinityPaginationResponse,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { IPaginationOptions } from '../utils/types/pagination-options';

@ApiTags('orders')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderChangeLogService: OrderChangeLogService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  create(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get orders with filters',
    description:
      'Unified endpoint to get orders with flexible filtering options. Replaces multiple specific endpoints.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of orders with optional optimization.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() filterDto: FindAllOrdersDto): Promise<Order[]> {
    return this.ordersService.findAllWithFilters(filterDto);
  }

  @Post('quick-finalize-multiple')
  @ApiOperation({
    summary: 'Finalización rápida de múltiples órdenes',
    description:
      'Finaliza múltiples órdenes de forma rápida, registrando automáticamente un pago en efectivo por el monto pendiente de cada una y cambiando su estado a COMPLETED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Las órdenes han sido finalizadas exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Una o más órdenes no pueden ser finalizadas.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async quickFinalizeMultipleOrders(
    @Body() dto: { orderIds: string[] },
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string; ordersWithWarnings: string[] }> {
    const result = await this.ordersService.quickFinalizeMultipleOrders(
      dto.orderIds,
      userId,
    );
    return {
      message: 'Órdenes finalizadas exitosamente',
      ordersWithWarnings: result.ordersWithWarnings,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the order with the specified ID.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific order by ID' })
  @ApiResponse({
    status: 200,
    description: 'The order has been successfully updated.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Post(':id/recover')
  @ApiOperation({ summary: 'Recover a completed or cancelled order' })
  @ApiResponse({
    status: 200,
    description: 'The order has been successfully recovered to READY status.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier)
  recoverOrder(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.recoverOrder(id);
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get history for a specific order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the history log for the specified order.',
    type: InfinityPaginationResponse(EnrichedOrderHistoryDto),
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    RoleEnum.admin,
    RoleEnum.manager,
    RoleEnum.cashier,
    RoleEnum.waiter,
    RoleEnum.kitchen,
  )
  async getOrderHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<EnrichedOrderHistoryDto>> {
    const paginationOptions: IPaginationOptions = {
      page,
      limit: limit > 50 ? 50 : limit,
    };
    const [data] = await this.orderChangeLogService.findByOrderId(
      id,
      paginationOptions,
    );
    return infinityPagination(data, paginationOptions);
  }

  @Post(':id/print-ticket')
  @ApiOperation({ summary: 'Imprimir ticket de una orden' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la orden' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'ID de la impresora' },
        ticketType: {
          type: 'string',
          enum: ['GENERAL', 'BILLING'],
          description: 'Tipo de ticket a imprimir',
        },
      },
      required: ['printerId', 'ticketType'],
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async printTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    printTicketDto: { printerId: string; ticketType: 'GENERAL' | 'BILLING' },
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.ordersService.printOrderTicket(
      id,
      printTicketDto.printerId,
      printTicketDto.ticketType,
      userId,
    );
  }

  @Get('shift/:shiftId/sales-summary')
  @ApiOperation({
    summary: 'Obtener resumen de ventas de un turno',
    description:
      'Obtiene un resumen detallado de las ventas de un turno, agrupado por categorías, subcategorías y productos',
  })
  @ApiParam({
    name: 'shiftId',
    type: 'string',
    description: 'ID del turno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen de ventas del turno',
    schema: {
      type: 'object',
      properties: {
        shiftId: { type: 'string' },
        shiftNumber: { type: 'number' },
        date: { type: 'string', format: 'date' },
        totalSales: { type: 'number' },
        totalQuantity: { type: 'number' },
        completedOrders: { type: 'number' },
        averageTicket: { type: 'number' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              categoryName: { type: 'string' },
              quantity: { type: 'number' },
              totalAmount: { type: 'number' },
              percentage: { type: 'number' },
              subcategories: { type: 'array' },
            },
          },
        },
        topProducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              productName: { type: 'string' },
              quantity: { type: 'number' },
              totalAmount: { type: 'number' },
              averagePrice: { type: 'number' },
            },
          },
        },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager)
  async getShiftSalesSummary(@Param('shiftId', ParseUUIDPipe) shiftId: string) {
    return this.ordersService.getShiftSalesSummary(shiftId);
  }
}
