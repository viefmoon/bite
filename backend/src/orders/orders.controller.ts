// src/orders/orders.controller.ts
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
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { Order } from './domain/order';
import { IPaginationOptions } from '../utils/types/pagination-options';
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
  @ApiOperation({ summary: 'Get all orders with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders that match the filters.',
    type: InfinityPaginationResponse(Order),
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  async findAll(
    @Query() filterOptions: FindAllOrdersDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<Order>> {
    const paginationOptions: IPaginationOptions = {
      page,
      limit: limit > 50 ? 50 : limit,
    };
    const [data] = await this.ordersService.findAll(
      filterOptions,
      paginationOptions,
    );
    return infinityPagination(data, paginationOptions); // Pasar total a infinityPagination si es necesario
  }

  @Get('open-today')
  @ApiOperation({ summary: 'Obtener las órdenes abiertas del turno actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes abiertas del turno actual.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  findOpenOrders(): Promise<Order[]> {
    return this.ordersService.findOpenOrders();
  }

  @Get('open-current-shift')
  @ApiOperation({ summary: 'Obtener las órdenes abiertas del turno actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes abiertas del turno actual.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  findOpenOrdersCurrentShift(): Promise<Order[]> {
    return this.ordersService.findOpenOrders();
  }

  @Get('for-finalization')
  @ApiOperation({ summary: 'Obtener todas las órdenes para finalizar' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas las órdenes disponibles para finalización.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  @HttpCode(HttpStatus.OK)
  findOrdersForFinalization(): Promise<Order[]> {
    return this.ordersService.findOrdersForFinalization();
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
  @ApiOperation({ summary: 'Get all orders for a specific shift' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders for the specified shift.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  findByShiftId(
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
  ): Promise<Order[]> {
    return this.ordersService.findByShiftId(shiftId);
  }

  // OrderItem endpoints
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

  // --- Historial Endpoints ---

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
    return infinityPagination(data, paginationOptions); // Pasar total si es necesario
  }

  // --- Kitchen Preparation Status Endpoints ---

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
    // Cambiar todos los items PENDING a IN_PROGRESS
    await this.ordersService.changeOrderItemsStatus(
      id,
      userId,
      'PENDING',
      'IN_PROGRESS',
    );

    // Actualizar el estado de la orden a IN_PREPARATION
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
    // Obtener el estado actual de la orden con sus items
    const order = await this.ordersService.findOne(id);

    if (order.orderStatus === OrderStatus.READY) {
      // Si la orden está LISTA y se regresa a EN PREPARACIÓN:
      // Los OrderItems mantienen su estado (READY)
      // Solo cambiamos el estado de la orden
      await this.ordersService.update(id, {
        orderStatus: OrderStatus.IN_PREPARATION,
      });
    } else if (order.orderStatus === OrderStatus.IN_PREPARATION) {
      // Si la orden está EN PREPARACIÓN y se regresa a EN PROGRESO:
      // Todos los items deben regresar a PENDING

      // Cambiar items IN_PROGRESS a PENDING
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

      // Cambiar items READY a PENDING
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

      // Cambiar el estado de la orden
      await this.ordersService.update(id, {
        orderStatus: OrderStatus.IN_PROGRESS,
      });
    } else if (order.orderStatus === OrderStatus.IN_PROGRESS) {
      // La orden ya está en IN_PROGRESS, no hay nada que hacer
      // Esto puede pasar si todos los items están READY pero la orden no fue marcada como READY
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
    // Cambiar todos los items IN_PROGRESS a READY
    await this.ordersService.changeOrderItemsStatus(
      id,
      userId,
      'IN_PROGRESS',
      'READY',
    );

    // Actualizar el estado de la orden a READY
    await this.ordersService.update(id, {
      orderStatus: OrderStatus.READY,
    });
  }
}
