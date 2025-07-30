import {
  DefaultValuePipe,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { Order } from './domain/order';
import { OrderForFinalizationDto } from './dto/order-for-finalization.dto';
import { OrderForFinalizationListDto } from './dto/order-for-finalization-list.dto';
import { OrderOpenListDto } from './dto/order-open-list.dto';
import { ReceiptListDto } from './dto/receipt-list.dto';
import { ReceiptDetailDto } from './dto/receipt-detail.dto';
import { OrderType } from './domain/enums/order-type.enum';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './domain/order-item';
import { OrderStatus } from './domain/enums/order-status.enum';
import { FinalizeOrdersDto } from './dto/finalize-orders.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiQuery,
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
import { plainToInstance } from 'class-transformer';
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

  @Get('open-orders-list')
  @ApiOperation({ summary: 'Obtener lista optimizada de órdenes abiertas' })
  @ApiResponse({
    status: 200,
    description:
      'Lista optimizada de órdenes abiertas con campos mínimos necesarios.',
    type: [OrderOpenListDto],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async findOpenOrdersList(): Promise<OrderOpenListDto[]> {
    return this.ordersService.findOpenOrdersOptimized();
  }

  @Get('receipts-list')
  @ApiOperation({
    summary:
      'Obtener lista optimizada de recibos del turno actual (órdenes completadas/canceladas)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista optimizada de recibos del turno actual con campos mínimos necesarios.',
    type: [ReceiptListDto],
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'orderType', required: false, enum: OrderType })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier)
  @HttpCode(HttpStatus.OK)
  async findReceiptsList(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderType') orderType?: OrderType,
  ): Promise<ReceiptListDto[]> {
    const filterOptions: any = {};

    if (startDate) {
      filterOptions.startDate = new Date(startDate);
    }
    if (endDate) {
      filterOptions.endDate = new Date(endDate);
    }
    if (orderType) {
      filterOptions.orderType = orderType;
    }

    return this.ordersService.getReceiptsList(filterOptions);
  }

  @Get('receipts/:id')
  @ApiOperation({ summary: 'Obtener detalle completo de un recibo' })
  @ApiResponse({
    status: 200,
    description: 'Detalle completo del recibo con todos los datos necesarios.',
    type: ReceiptDetailDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async getReceiptDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReceiptDetailDto> {
    return this.ordersService.getReceiptDetail(id);
  }

  @Get('for-finalization/list')
  @ApiOperation({ summary: 'Obtener lista ligera de órdenes para finalizar' })
  @ApiResponse({
    status: 200,
    description: 'Lista optimizada de órdenes para la vista de lista.',
    type: [OrderForFinalizationListDto],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  async findOrdersForFinalizationList(): Promise<
    OrderForFinalizationListDto[]
  > {
    return this.ordersService.findOrdersForFinalizationList();
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a specific order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the order item with the specified ID.',
    type: OrderItem,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  findOrderItemById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderItem> {
    return this.ordersService.findOrderItemById(id);
  }

  @Patch('finalize-multiple')
  @ApiOperation({ summary: 'Finalizar múltiples órdenes' })
  @ApiResponse({
    status: 200,
    description: 'Las órdenes han sido finalizadas exitosamente.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  finalizeMultipleOrders(
    @Body() finalizeOrdersDto: FinalizeOrdersDto,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.ordersService.finalizeMultipleOrders(finalizeOrdersDto, userId);
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

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a specific order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'The order item has been successfully updated.',
    type: OrderItem,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  updateOrderItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    return this.ordersService.updateOrderItem(id, updateOrderItemDto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a specific order item by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The order item has been successfully deleted.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  removeOrderItem(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.deleteOrderItem(id);
  }

  @Get('for-finalization/:id')
  @ApiOperation({
    summary: 'Obtener detalle completo de una orden para finalización',
  })
  @ApiResponse({
    status: 200,
    description:
      'Detalle completo de la orden con todos sus items y relaciones.',
    type: OrderForFinalizationDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  findOrderForFinalizationById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderForFinalizationDto> {
    return this.ordersService.findOrderForFinalizationById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders for the specified user.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Order[]> {
    return this.ordersService.findByUserId(userId);
  }

  @Get('table/:tableId')
  @ApiOperation({ summary: 'Get all orders for a specific table' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders for the specified table.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  findByTableId(
    @Param('tableId', ParseUUIDPipe) tableId: string,
  ): Promise<Order[]> {
    return this.ordersService.findByTableId(tableId);
  }

  @Get('shift/:shiftId')
  @ApiOperation({
    summary:
      'Get all orders for a specific shift with preparation status summary',
  })
  @ApiResponse({
    status: 200,
    description:
      'Return all orders for the specified shift with calculated preparation screen statuses.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  findByShiftId(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
  ): Promise<any[]> {
    return this.ordersService.findByShiftId(shiftId);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific order by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The order has been successfully deleted.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.remove(id);
  }

  @Post(':id/recover')
  @ApiOperation({ summary: 'Recover a completed or cancelled order' })
  @ApiResponse({
    status: 200,
    description:
      'The order has been successfully recovered to DELIVERED status.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  recoverOrder(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
    return this.ordersService.recoverOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status' })
  @ApiResponse({
    status: 200,
    description: 'The order status has been successfully changed.',
    type: Order,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  changeOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: OrderStatus },
  ): Promise<Order> {
    return this.ordersService.changeOrderStatus(id, body.status);
  }

  @Post(':orderId/items')
  @ApiOperation({ summary: 'Create a new order item for an order' })
  @ApiResponse({
    status: 201,
    description: 'The order item has been successfully created.',
    type: OrderItem,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  createOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() createOrderItemDto: CreateOrderItemDto,
  ): Promise<OrderItem> {
    createOrderItemDto.orderId = orderId;
    return this.ordersService.createOrderItem(createOrderItemDto);
  }

  @Get(':orderId/items')
  @ApiOperation({ summary: 'Get all order items for a specific order' })
  @ApiResponse({
    status: 200,
    description: 'Return all order items for the specified order.',
    type: [OrderItem],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  findOrderItemsByOrderId(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<OrderItem[]> {
    return this.ordersService.findOrderItemsByOrderId(orderId);
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

  @Patch(':id/start-preparation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Start order preparation',
    description:
      'Changes all pending items of an order to IN_PROGRESS status and updates order status',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order preparation started successfully',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.kitchen)
  async startOrderPreparation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.ordersService.changeOrderItemsStatus(
      id,
      userId,
      'PENDING',
      'IN_PROGRESS',
    );

    await this.ordersService.update(id, {
      orderStatus: OrderStatus.IN_PREPARATION,
    });
  }

  @Patch(':id/cancel-preparation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel order preparation',
    description:
      'Returns order to previous state. If order is READY goes back to IN_PREPARATION (items keep their state). If order is IN_PREPARATION goes back to IN_PROGRESS (all items go to PENDING).',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order preparation cancelled successfully',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.kitchen)
  async cancelOrderPreparation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const order = await this.ordersService.findOne(id);

    if (order.orderStatus === OrderStatus.READY) {
      await this.ordersService.update(id, {
        orderStatus: OrderStatus.IN_PREPARATION,
      });
    } else if (order.orderStatus === OrderStatus.IN_PREPARATION) {
      const hasInProgressItems = await this.ordersService.hasItemsWithStatus(
        id,
        'IN_PROGRESS',
      );
      if (hasInProgressItems) {
        await this.ordersService.changeOrderItemsStatus(
          id,
          userId,
          'IN_PROGRESS',
          'PENDING',
        );
      }

      const hasReadyItems = await this.ordersService.hasItemsWithStatus(
        id,
        'READY',
      );
      if (hasReadyItems) {
        await this.ordersService.changeOrderItemsStatus(
          id,
          userId,
          'READY',
          'PENDING',
        );
      }

      await this.ordersService.update(id, {
        orderStatus: OrderStatus.IN_PROGRESS,
      });
    }
  }

  @Patch(':id/complete-preparation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Complete order preparation',
    description:
      'Changes all in-progress items of an order to READY status and updates order status',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order preparation completed successfully',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.kitchen)
  async completeOrderPreparation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.ordersService.changeOrderItemsStatus(
      id,
      userId,
      'IN_PROGRESS',
      'READY',
    );

    await this.ordersService.update(id, {
      orderStatus: OrderStatus.READY,
    });
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
