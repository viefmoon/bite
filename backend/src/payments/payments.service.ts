import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from './infrastructure/persistence/payment.repository';
import { Payment } from './domain/payment';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FindAllPaymentsDto } from './dto/find-all-payments.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from './domain/enums/payment-status.enum';
import { PAYMENT_REPOSITORY } from '../common/tokens';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = new Payment();
    payment.id = uuidv4();
    payment.orderId = createPaymentDto.orderId;
    payment.paymentMethod = createPaymentDto.paymentMethod;
    payment.amount = createPaymentDto.amount;
    payment.paymentStatus = PaymentStatus.PENDING;

    return this.paymentRepository.create(payment);
  }

  async findAll(findAllPaymentsDto: FindAllPaymentsDto): Promise<Payment[]> {

    const payments = await this.paymentRepository.findAll();


    let filteredPayments = payments;
    if (findAllPaymentsDto.orderId) {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.orderId === findAllPaymentsDto.orderId,
      );
    }


    if (findAllPaymentsDto.paymentMethod) {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.paymentMethod === findAllPaymentsDto.paymentMethod,
      );
    }


    if (findAllPaymentsDto.paymentStatus) {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.paymentStatus === findAllPaymentsDto.paymentStatus,
      );
    }

    return filteredPayments;
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const existingPayment = await this.findOne(id);


    const updatedPayment = new Payment();
    updatedPayment.id = id;
    updatedPayment.orderId = existingPayment.orderId;
    updatedPayment.paymentMethod =
      updatePaymentDto.paymentMethod ?? existingPayment.paymentMethod;
    updatedPayment.amount =
      updatePaymentDto.amount ?? existingPayment.amount;
    updatedPayment.paymentStatus =
      updatePaymentDto.paymentStatus ?? existingPayment.paymentStatus;

    updatedPayment.createdAt = existingPayment.createdAt;
    updatedPayment.order = existingPayment.order;


    return this.paymentRepository.update(id, updatedPayment);
  }

  async remove(id: string): Promise<void> {

    await this.findOne(id);
    await this.paymentRepository.delete(id);
  }
}
