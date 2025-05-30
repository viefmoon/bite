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
import { OrderItemModifier } from './domain/order-item-modifier';
import { UpdateOrderItemModifierDto } from './dto/update-order-item-modifier.dto';
import { CreateOrderItemModifierDto } from './dto/create-order-item-modifier.dto';
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
import {
  OrderChangeLogService,
  EnrichedOrderHistoryDto,
} from './order-change-log.service';
import {
  OrderItemChangeLogService,
  EnrichedOrderItemHistoryDto,
} from './order-item-change-log.service';
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
    private readonly orderItemChangeLogService: OrderItemChangeLogService,
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
  async findAll(
    @Query() filterOptions: FindAllOrdersDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<Order>> {
    const paginationOptions: IPaginationOptions = {
      page,
      limit: limit > 50 ? 50 : limit,
    };
    const [data, total] = await this.ordersService.findAll(
      // Corregido para obtener total
      filterOptions,
      paginationOptions,
    );
    return infinityPagination(data, paginationOptions); // Pasar total a infinityPagination si es necesario
  }

  @Get('open-today')
  @ApiOperation({ summary: 'Obtener las órdenes abiertas del día actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes abiertas del día actual.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  findOpenOrders(): Promise<Order[]> {
    return this.ordersService.findOpenOrders();
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders for the specified user.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
  findByTableId(
    @Param('tableId', ParseUUIDPipe) tableId: string,
  ): Promise<Order[]> {
    return this.ordersService.findByTableId(tableId);
  }

  @Get('counter/:counterId')
  @ApiOperation({ summary: 'Get all orders for a specific daily counter' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders for the specified daily counter.',
    type: [Order],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  findByDailyOrderCounterId(
    @Param('counterId', ParseUUIDPipe) counterId: string,
  ): Promise<Order[]> {
    return this.ordersService.findByDailyOrderCounterId(counterId);
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
  removeOrderItem(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.ordersService.deleteOrderItem(id);
  }
  // OrderItemModifier endpoints
  @Post('items/:orderItemId/modifiers')
  @ApiOperation({ summary: 'Create a new modifier for an order item' })
  @ApiResponse({
    status: 201,
    description: 'The order item modifier has been successfully created.',
    type: OrderItemModifier,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  createOrderItemModifier(
    @Param('orderItemId', ParseUUIDPipe) orderItemId: string,
    // Corregir tipo de DTO
    @Body() createDto: CreateOrderItemModifierDto,
  ): Promise<OrderItemModifier> {
    // Corregir llamada al servicio para pasar un objeto
    return this.ordersService.createOrderItemModifier({
      orderItemId: orderItemId,
      productModifierId: createDto.productModifierId,
      quantity: createDto.quantity,
      price: createDto.price,
    });
  }

  @Get('items/:orderItemId/modifiers')
  @ApiOperation({ summary: 'Get all modifiers for a specific order item' })
  @ApiResponse({
    status: 200,
    description: 'Return all modifiers for the specified order item.',
    type: [OrderItemModifier],
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOrderItemModifiersByOrderItemId(
    @Param('orderItemId', ParseUUIDPipe) orderItemId: string,
  ): Promise<OrderItemModifier[]> {
    return this.ordersService.findOrderItemModifiersByOrderItemId(orderItemId);
  }

  @Get('items/modifiers/:id')
  @ApiOperation({ summary: 'Get a specific order item modifier by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the order item modifier with the specified ID.',
    type: OrderItemModifier,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOrderItemModifierById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderItemModifier> {
    return this.ordersService.findOrderItemModifierById(id);
  }

  @Patch('items/modifiers/:id')
  @ApiOperation({ summary: 'Update a specific order item modifier by ID' })
  @ApiResponse({
    status: 200,
    description: 'The order item modifier has been successfully updated.',
    type: OrderItemModifier,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  updateOrderItemModifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderItemModifierDto: UpdateOrderItemModifierDto,
  ): Promise<OrderItemModifier> {
    return this.ordersService.updateOrderItemModifier(
      id,
      updateOrderItemModifierDto,
    );
  }

  @Delete('items/modifiers/:id')
  @ApiOperation({ summary: 'Delete a specific order item modifier by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The order item modifier has been successfully deleted.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  removeOrderItemModifier(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.ordersService.deleteOrderItemModifier(id);
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
  @Roles(RoleEnum.admin)
  async getOrderHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<EnrichedOrderHistoryDto>> {
    const paginationOptions: IPaginationOptions = {
      page,
      limit: limit > 50 ? 50 : limit,
    };
    const [data, total] = await this.orderChangeLogService.findByOrderId(
      // Corregido para obtener total
      id,
      paginationOptions,
    );
    return infinityPagination(data, paginationOptions); // Pasar total si es necesario
  }

  @Get('items/:id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get history for a specific order item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the history log for the specified order item.',
    type: InfinityPaginationResponse(EnrichedOrderItemHistoryDto),
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  async getOrderItemHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<EnrichedOrderItemHistoryDto>> {
    const paginationOptions: IPaginationOptions = {
      page,
      limit: limit > 50 ? 50 : limit,
    };
    const [data, total] =
      await this.orderItemChangeLogService.findByOrderItemId(
        // Corregido para obtener total
        id,
        paginationOptions,
      );
    return infinityPagination(data, paginationOptions); // Pasar total si es necesario
  }
}
