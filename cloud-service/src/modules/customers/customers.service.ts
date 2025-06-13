import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerDeliveryInfo } from '../../entities';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerDeliveryInfo)
    private deliveryInfoRepository: Repository<CustomerDeliveryInfo>,
  ) {}

  async findOrCreateByPhone(phoneNumber: string): Promise<Customer> {
    let customer = await this.customerRepository.findOne({
      where: { phoneNumber },
      relations: ['deliveryInfo'],
    });

    if (!customer) {
      customer = await this.customerRepository.save({
        phoneNumber,
        lastInteraction: new Date(),
      });
    }

    return customer;
  }

  async updateLastInteraction(customerId: string): Promise<void> {
    await this.customerRepository.update(customerId, {
      lastInteraction: new Date(),
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['deliveryInfo'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findByPhone(phoneNumber: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { phoneNumber },
      relations: ['deliveryInfo'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async createOrUpdateDeliveryInfo(
    customerId: string,
    deliveryInfo: Partial<CustomerDeliveryInfo>
  ): Promise<CustomerDeliveryInfo> {
    const customer = await this.findById(customerId);

    let existingInfo = await this.deliveryInfoRepository.findOne({
      where: { customerId },
    });

    if (existingInfo) {
      await this.deliveryInfoRepository.update(existingInfo.id, deliveryInfo);
      return this.deliveryInfoRepository.findOne({ where: { id: existingInfo.id } });
    } else {
      return this.deliveryInfoRepository.save({
        ...deliveryInfo,
        customerId,
      });
    }
  }
}