import { API_URL } from '@env';
import apiClient from '../app/services/apiClient';
import * as FileSystem from 'expo-file-system';

export interface AIOrderItem {
  productId: string;
  productName?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  modifiers?: string[];
  pizzaCustomizations?: Array<{
    customizationId: string;
    customizationName?: string;
    half: 'FULL' | 'HALF_1' | 'HALF_2';
    action: 'ADD' | 'REMOVE';
  }>;
}

export interface DeliveryInfoData {
  fullAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface ScheduledDeliveryData {
  time?: string;
}

export interface AudioOrderResponse {
  success: boolean;
  data?: {
    orderItems?: AIOrderItem[];
    deliveryInfo?: DeliveryInfoData;
    scheduledDelivery?: ScheduledDeliveryData;
    orderType?: 'DELIVERY' | 'TAKE_AWAY' | 'DINE_IN';
    warnings?: string;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    type: string;
    timestamp: string;
    requestId: string;
  };
}

class AudioOrderService {
  constructor() {
    // API URL se maneja en apiClient
  }

  async processAudioOrder(
    audioUri: string,
    transcription: string
  ): Promise<AudioOrderResponse> {
    try {
      // Convertir audio a base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Preparar payload para el backend
      const payload = {
        audioData: audioBase64,
        transcription: transcription,
        audioFormat: 'audio/mp4',
      };

      // Enviar al backend que se comunicará con el servidor remoto
      const response = await apiClient.post('/api/audio-orders/process', payload);
      
      // Verificar que tengamos una respuesta válida
      if (!response || !response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      const responseData = response.data as any;
      
      console.log('=== DEBUG audioOrderService ===');
      console.log('Response from backend:', JSON.stringify(responseData, null, 2));
      console.log('extractedData:', JSON.stringify(responseData.extractedData, null, 2));
      console.log('orderType:', responseData.extractedData?.orderType);
      console.log('==============================');
      
      // Adaptar la respuesta del backend al formato esperado
      if (responseData.success) {
        return {
          success: true,
          data: responseData.extractedData || {
            orderItems: [],
            deliveryInfo: {},
            scheduledDelivery: {},
            orderType: undefined,
            warnings: undefined,
            processingTime: 0
          }
        };
      } else {
        throw new Error(responseData.error?.message || responseData.message || 'Error procesando audio');
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.error?.code || 'PROCESSING_ERROR',
          message: this.getErrorMessage(error),
          type: 'error',
          timestamp: new Date().toISOString(),
          requestId: 'local-' + Date.now()
        }
      };
    }
  }

  getErrorMessage(error: any): string {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      switch (apiError.code) {
        case 'BL015':
          return 'El archivo de audio es muy grande. Máximo 10MB.';
        case 'AUTH001':
          return 'Error de autenticación. Contacta al administrador.';
        case 'BL016':
          return 'No se pudo procesar el audio. Intenta de nuevo.';
        case 'BL002':
          return 'Faltan datos requeridos.';
        default:
          return apiError.message || 'Error desconocido';
      }
    }
    
    return error.message || 'Error al procesar la orden por voz';
  }

  // Método para validar antes de enviar
  validateBeforeSending(audioFileSize: number, transcription: string): string[] {
    const errors: string[] = [];
    
    // Validar tamaño (50MB máximo para audio de hasta 5 minutos)
    if (audioFileSize > 50 * 1024 * 1024) {
      errors.push('El archivo de audio es muy grande (máximo 50MB)');
    }
    
    // Validar transcripción
    if (!transcription || transcription.trim().length < 5) {
      errors.push('La transcripción está vacía o es muy corta');
    }
    
    return errors;
  }
}

export const audioOrderService = new AudioOrderService();