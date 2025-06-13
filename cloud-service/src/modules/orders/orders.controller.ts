import { Controller, Get, Post, Put, Body, Param, Headers } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get('unsynced')
  async getUnsyncedOrders(@Headers('x-api-key') apiKey: string) {
    // Verificar API key
    if (apiKey !== process.env.SYNC_API_KEY) {
      throw new Error('Unauthorized');
    }

    return this.ordersService.getUnsyncedOrders();
  }

  @Put(':id/sync')
  async markAsSynced(
    @Param('id') id: string,
    @Body() body: { localId: number },
    @Headers('x-api-key') apiKey: string,
  ) {
    // Verificar API key
    if (apiKey !== process.env.SYNC_API_KEY) {
      throw new Error('Unauthorized');
    }

    return this.ordersService.markAsSynced(id, body.localId);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: any },
  ) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }
}