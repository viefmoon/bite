import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp } from '../../entities';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOTP(customerId: string, otp: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos de validez

    await this.otpRepository.save({
      customerId,
      otp,
      expiresAt,
    });
  }

  async verifyOTP(customerId: string, otp: string): Promise<boolean> {
    const record = await this.otpRepository.findOne({
      where: {
        customerId,
        otp,
        used: false,
      },
    });

    if (!record) {
      return false;
    }

    if (new Date() > record.expiresAt) {
      return false;
    }

    // Marcar como usado
    await this.otpRepository.update(record.id, { used: true });
    return true;
  }

  @Cron('0 */30 * * * *') // Cada 30 minutos
  async cleanupExpiredOTPs(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}