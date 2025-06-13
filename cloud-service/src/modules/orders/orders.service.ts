import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem } from '../../entities';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      status: 'created',
      syncedWithLocal: false,
      dailyOrderNumber: await this.getNextDailyOrderNumber(),
    });

    // Guardar orden
    const savedOrder = await this.orderRepository.save(order);

    // Crear items
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      const orderItems = createOrderDto.items.map(item => 
        this.orderItemRepository.create({
          ...item,
          orderId: savedOrder.id,
        })
      );
      
      savedOrder.items = await this.orderItemRepository.save(orderItems);
    }

    return savedOrder;
  }

  async getUnsyncedOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      where: { syncedWithLocal: false },
      relations: ['items'],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsSynced(orderId: string, localId: number): Promise<Order> {
    await this.orderRepository.update(orderId, {
      syncedWithLocal: true,
      localId,
    });

    return this.orderRepository.findOne({ where: { id: orderId } });
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    await this.orderRepository.update(orderId, { status });
    return this.orderRepository.findOne({ 
      where: { id: orderId },
      relations: ['items']
    });
  }

  private async getNextDailyOrderNumber(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .andWhere('order.createdAt < :tomorrow', { tomorrow })
      .orderBy('order.dailyOrderNumber', 'DESC')
      .getOne();

    return lastOrder ? lastOrder.dailyOrderNumber + 1 : 1;
  }

  async findById(id: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'customer'],
    });
  }

  async findByWhatsAppMessageId(messageId: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { whatsappMessageId: messageId },
      relations: ['items'],
    });
  }
}