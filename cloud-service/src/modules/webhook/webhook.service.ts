import { Injectable, Logger } from '@nestjs/common';
import { WebhookBody, WhatsAppMessage } from '../../types';
import { AiService } from '../ai/ai.service';
import { SyncService } from '../sync/sync.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private aiService: AiService,
    private syncService: SyncService,
    private whatsappService: WhatsappService,
  ) {}

  async processWebhook(body: WebhookBody): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const messages = body.entry.flatMap(
      entry => entry.changes?.flatMap(change => change.value?.messages || []) || []
    );

    for (const message of messages) {
      await this.handleMessage(message);
    }
  }

  private async handleMessage(message: WhatsAppMessage): Promise<void> {
    try {
      this.logger.log(`Processing message ${message.id} from ${message.from}`);

      // Reenviar el mensaje al backend local para procesamiento
      const processed = await this.syncService.forwardMessageToBackend(message);
      
      if (!processed) {
        // Si el backend local no puede procesarlo, usar IA como fallback
        await this.processWithAI(message);
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
      await this.whatsappService.sendMessage(
        message.from,
        'Ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.'
      );
    }
  }

  private async processWithAI(message: WhatsAppMessage): Promise<void> {
    // Procesar según tipo de mensaje
    switch (message.type) {
      case 'text':
        await this.handleTextMessage(message);
        break;
      case 'interactive':
        await this.handleInteractiveMessage(message);
        break;
      case 'audio':
        await this.handleAudioMessage(message);
        break;
      default:
        await this.whatsappService.sendMessage(
          message.from,
          'Lo siento, solo puedo procesar mensajes de texto, audio o interactivos.'
        );
    }
  }

  private async handleTextMessage(message: WhatsAppMessage): Promise<void> {
    const response = await this.aiService.processMessage(
      message.from,
      message.text.body
    );

    if (response.text) {
      await this.whatsappService.sendMessage(message.from, response.text);
    }

    if (response.orderData) {
      // Enviar datos de orden al backend local
      await this.syncService.createOrderInBackend({
        ...response.orderData,
        customerPhone: message.from,
      });
    }
  }

  private async handleInteractiveMessage(message: WhatsAppMessage): Promise<void> {
    const { interactive } = message;
    
    if (interactive.type === 'button_reply') {
      // Reenviar respuesta interactiva al backend local
      await this.syncService.forwardInteractiveResponse(message);
    }
  }

  private async handleAudioMessage(message: WhatsAppMessage): Promise<void> {
    // Transcribir audio y procesarlo como texto
    const transcription = await this.aiService.transcribeAudio(message.audio.id);
    
    if (transcription) {
      await this.handleTextMessage({
        ...message,
        text: { body: transcription },
        type: 'text',
      });
    }
  }
}