import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLog } from '../../entities';
import { WebhookBody, WhatsAppMessage } from '@shared/types';
import { CustomersService } from '../customers/customers.service';
import { AiService } from '../ai/ai.service';
import { OrdersService } from '../orders/orders.service';
import { OtpService } from '../otp/otp.service';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class WebhookService {
  private whatsappService: WhatsAppService;

  constructor(
    @InjectRepository(MessageLog)
    private messageLogRepository: Repository<MessageLog>,
    private customersService: CustomersService,
    private aiService: AiService,
    private ordersService: OrdersService,
    private otpService: OtpService,
  ) {
    this.whatsappService = new WhatsAppService();
  }

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
      // Verificar si ya procesamos este mensaje
      const existingLog = await this.messageLogRepository.findOne({
        where: { messageId: message.id }
      });

      if (existingLog) {
        return;
      }

      // Marcar mensaje como procesado
      await this.messageLogRepository.save({
        messageId: message.id,
        processed: true,
      });

      // Obtener o crear cliente
      const customer = await this.customersService.findOrCreateByPhone(message.from);
      await this.customersService.updateLastInteraction(customer.id);

      // Verificar si el cliente tiene información de entrega
      if (!customer.deliveryInfo) {
        await this.handleMissingDeliveryInfo(message.from);
        return;
      }

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
    } catch (error) {
      console.error('Error handling message:', error);
      await this.whatsappService.sendMessage(
        message.from,
        'Ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente.'
      );
    }
  }

  private async handleMissingDeliveryInfo(phoneNumber: string): Promise<void> {
    const otp = this.otpService.generateOTP();
    await this.otpService.storeOTP(phoneNumber, otp);

    const registrationLink = `${process.env.FRONTEND_BASE_URL}/delivery-info/${phoneNumber}?otp=${otp}`;
    
    await this.whatsappService.sendMessage(
      phoneNumber,
      `¡Hola! 👋 Antes de continuar, necesitamos que registres tu información de entrega.\\n\\nPor favor usa este enlace: ${registrationLink}\\n\\nEste enlace es válido por 10 minutos.`
    );
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
      const order = await this.ordersService.createOrder({
        ...response.orderData,
        customerId: message.from,
        customerPhone: message.from,
      });

      await this.whatsappService.sendOrderConfirmation(message.from, order);
    }
  }

  private async handleInteractiveMessage(message: WhatsAppMessage): Promise<void> {
    const { interactive } = message;
    
    if (interactive.type === 'button_reply') {
      // Manejar respuestas de botones
      switch (interactive.button_reply.id) {
        case 'confirm_order':
          // Lógica para confirmar orden
          break;
        case 'cancel_order':
          // Lógica para cancelar orden
          break;
      }
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