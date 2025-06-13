import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import axios from 'axios';

interface ProcessedMessage {
  text?: string;
  orderData?: any;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processMessage(from: string, message: string): Promise<ProcessedMessage> {
    try {
      // Analizar el mensaje con IA para detectar intención de orden
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente de pedidos para un restaurante. 
            Analiza el mensaje del cliente y determina si quiere hacer un pedido.
            Si es un pedido, extrae los productos y detalles.
            Responde en JSON con formato: { "isOrder": boolean, "products": [], "response": "texto de respuesta" }`
          },
          {
            role: 'user',
            content: message
          }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);

      if (result.isOrder && result.products.length > 0) {
        // Aquí podrías procesar los productos extraídos
        // Por ahora, solo devolvemos un mensaje
        return {
          text: result.response || 'He recibido tu pedido. Un momento mientras lo proceso...',
          orderData: null // Aquí irían los datos procesados del pedido
        };
      }

      return {
        text: result.response || 'No entendí tu mensaje. ¿Podrías repetirlo?'
      };
    } catch (error) {
      console.error('Error processing message with AI:', error);
      return {
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.'
      };
    }
  }

  async transcribeAudio(audioId: string): Promise<string | null> {
    try {
      // Primero obtener la URL del audio desde WhatsApp
      const mediaResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${audioId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      );

      // Descargar el audio
      const audioResponse = await axios.get(mediaResponse.data.url, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        },
        responseType: 'arraybuffer'
      });

      // Transcribir con Whisper
      const formData = new FormData();
      const audioBlob = new Blob([audioResponse.data], { type: 'audio/ogg' });
      formData.append('file', audioBlob, 'audio.ogg');
      formData.append('model', 'whisper-1');

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioBlob as any,
        model: 'whisper-1',
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }
}