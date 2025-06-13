import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('health')
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('pending-orders')
  async getPendingOrders(@Headers('x-api-key') apiKey: string) {
    this.validateApiKey(apiKey);
    return this.syncService.getPendingOrders();
  }

  private validateApiKey(apiKey: string): void {
    if (apiKey !== process.env.SYNC_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}