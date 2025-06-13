import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WhatsAppMessage } from '../../types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly backendUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.backendUrl = this.configService.get<string>('BACKEND_LOCAL_URL') || 'http://localhost:3000';
  }

  async forwardMessageToBackend(message: WhatsAppMessage): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.backendUrl}/webhook/whatsapp`, {
          message,
          source: 'cloud-service'
        })
      );
      
      return response.data.processed === true;
    } catch (error) {
      this.logger.error('Error forwarding message to backend:', error);
      return false;
    }
  }

  async createOrderInBackend(orderData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.backendUrl}/orders/from-cloud`, orderData)
      );
      
      this.logger.log('Order created successfully in backend');
    } catch (error) {
      this.logger.error('Error creating order in backend:', error);
      throw error;
    }
  }

  async forwardInteractiveResponse(message: WhatsAppMessage): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.backendUrl}/webhook/interactive`, {
          message,
          source: 'cloud-service'
        })
      );
      
      this.logger.log('Interactive response forwarded successfully');
    } catch (error) {
      this.logger.error('Error forwarding interactive response:', error);
      throw error;
    }
  }

  async syncDatabaseChanges(): Promise<void> {
    try {
      // Este método puede ser llamado periódicamente para sincronizar cambios
      // Por ahora no implementamos lógica específica ya que usamos la BD clonada
      this.logger.log('Database sync check completed');
    } catch (error) {
      this.logger.error('Error during database sync:', error);
    }
  }
}