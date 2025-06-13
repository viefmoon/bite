import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Order } from '../../entities';

@Injectable()
export class WhatsAppService {
  private readonly apiUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  private readonly headers = {
    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  async sendMessage(to: string, text: string): Promise<string | null> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        { headers: this.headers }
      );

      return response.data.messages[0].id;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return null;
    }
  }

  async sendInteractiveMessage(to: string, interactive: any): Promise<string | null> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'interactive',
          interactive,
        },
        { headers: this.headers }
      );

      return response.data.messages[0].id;
    } catch (error) {
      console.error('Error sending WhatsApp interactive message:', error);
      return null;
    }
  }

  async sendOrderConfirmation(to: string, order: Order): Promise<void> {
    const message = `🎉 *¡Tu orden ha sido creada!*\\n\\n` +
      `📋 *Número de orden:* ${order.dailyOrderNumber || order.id}\\n` +
      `🚚 *Tipo:* ${order.orderType === 'delivery' ? 'Entrega a domicilio' : 'Recoger en tienda'}\\n` +
      `💰 *Total:* $${order.totalCost}\\n` +
      `⏱️ *Tiempo estimado:* ${order.estimatedTime} minutos\\n\\n` +
      `Te notificaremos cuando tu orden sea aceptada. ¡Gracias por tu preferencia!`;

    await this.sendMessage(to, message);

    // Enviar mensaje interactivo con opciones
    const interactive = {
      type: 'button',
      body: {
        text: '¿Qué deseas hacer con tu orden?'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'modify_order',
              title: 'Modificar'
            }
          },
          {
            type: 'reply',
            reply: {
              id: 'cancel_order',
              title: 'Cancelar'
            }
          }
        ]
      }
    };

    const messageId = await this.sendInteractiveMessage(to, interactive);
    
    if (messageId) {
      // Actualizar orden con el ID del mensaje
      order.whatsappMessageId = messageId;
    }
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    try {
      // Primero obtener la URL del media
      const mediaResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        { headers: this.headers }
      );

      // Descargar el archivo
      const fileResponse = await axios.get(mediaResponse.data.url, {
        headers: this.headers,
        responseType: 'arraybuffer'
      });

      return Buffer.from(fileResponse.data);
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }
}