import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { OtpService } from '../otp/otp.service';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly otpService: OtpService,
  ) {}

  @Get(':phoneNumber')
  async getCustomer(@Param('phoneNumber') phoneNumber: string) {
    return this.customersService.findByPhone(phoneNumber);
  }

  @Post(':phoneNumber/delivery-info')
  async createDeliveryInfo(
    @Param('phoneNumber') phoneNumber: string,
    @Body() deliveryInfo: any,
    @Query('otp') otp: string,
  ) {
    // Verificar OTP
    const isValid = await this.otpService.verifyOTP(phoneNumber, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    const customer = await this.customersService.findOrCreateByPhone(phoneNumber);
    return this.customersService.createOrUpdateDeliveryInfo(customer.id, deliveryInfo);
  }

  @Put(':phoneNumber/delivery-info')
  async updateDeliveryInfo(
    @Param('phoneNumber') phoneNumber: string,
    @Body() deliveryInfo: any,
    @Query('otp') otp: string,
  ) {
    // Verificar OTP
    const isValid = await this.otpService.verifyOTP(phoneNumber, otp);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    const customer = await this.customersService.findByPhone(phoneNumber);
    return this.customersService.createOrUpdateDeliveryInfo(customer.id, deliveryInfo);
  }
}