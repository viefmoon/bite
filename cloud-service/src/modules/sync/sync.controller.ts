import { Controller, Get, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('health')
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Post('database')
  async syncDatabase(@Headers('x-api-key') apiKey: string) {
    this.validateApiKey(apiKey);
    await this.syncService.syncDatabaseChanges();
    return { message: 'Sync initiated' };
  }

  private validateApiKey(apiKey: string): void {
    if (apiKey !== process.env.SYNC_API_KEY) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}