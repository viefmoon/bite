import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentRepository } from '../../payment.repository';
import { Payment } from '../../../../domain/payment';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class RelationalPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly paymentMapper: PaymentMapper,
  ) {}

  async findAll(): Promise<Payment[]> {
    const paymentEntities = await this.paymentRepository.find();
    return paymentEntities
      .map((entity) => this.paymentMapper.toDomain(entity))
      .filter((item): item is Payment => item !== null);
  }

  async findById(id: string): Promise<Payment | null> {
    const paymentEntity = await this.paymentRepository.findOne({
      where: { id },
    });
    return paymentEntity ? this.paymentMapper.toDomain(paymentEntity) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const paymentEntities = await this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: ['order'],
    });
    return paymentEntities
      .map((entity) => this.paymentMapper.toDomain(entity))
      .filter((item): item is Payment => item !== null);
  }

  async create(payment: Payment): Promise<Payment> {
    const paymentEntity = this.paymentMapper.toEntity(payment);
    if (!paymentEntity) {
      throw new InternalServerErrorException('Error creating payment entity');
    }
    const savedEntity = await this.paymentRepository.save(paymentEntity);
    const domainResult = this.paymentMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping saved payment entity to domain',
      );
    }
    return domainResult;
  }

  async update(id: string, payment: Payment): Promise<Payment> {
    // Solo actualizar los campos que realmente cambian, no las relaciones
    const updateData: any = {};

    if (payment.paymentMethod !== undefined) {
      updateData.paymentMethod = payment.paymentMethod;
    }
    if (payment.amount !== undefined) {
      updateData.amount = payment.amount;
    }
    if (payment.paymentStatus !== undefined) {
      updateData.paymentStatus = payment.paymentStatus;
    }

    await this.paymentRepository.update(id, updateData);

    const updatedEntity = await this.paymentRepository.findOne({
      where: { id },
    });
    if (!updatedEntity) {
      throw new NotFoundException(
        `Payment with ID ${id} not found after update`,
      );
    }
    const domainResult = this.paymentMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping updated payment entity to domain',
      );
    }
    return domainResult;
  }

  async delete(id: string): Promise<void> {
    const result = await this.paymentRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
  }
}
