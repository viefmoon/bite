import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  ProcessAudioOrderDto,
  AudioOrderResponseDto,
  CloudApiRequestDto,
  CloudApiResponseDto,
} from '../dto/process-audio-order.dto';

@Injectable()
export class AudioOrderProcessingService {
  private readonly logger = new Logger(AudioOrderProcessingService.name);
  private readonly cloudApiUrl: string;
  private readonly cloudApiKey: string;
  private readonly isEnabled: boolean;
  private readonly timeout: number;
  private readonly maxAudioSizeMb: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const audioConfig = this.configService.get<any>('audioOrder');
    this.isEnabled = audioConfig?.enabled || false;
    this.cloudApiUrl = audioConfig?.cloudApiUrl || '';
    this.cloudApiKey = audioConfig?.cloudApiKey || '';
    this.timeout = audioConfig?.timeout || 30000;
    this.maxAudioSizeMb = audioConfig?.maxAudioSizeMb || 10;

    if (!this.cloudApiUrl || !this.cloudApiKey) {
      this.logger.warn(
        'Audio order processing missing configuration (CLOUD_API_URL or CLOUD_API_KEY)',
      );
    }
  }

  async processAudioOrder(
    dto: ProcessAudioOrderDto,
  ): Promise<AudioOrderResponseDto> {
    try {
      if (!this.isEnabled) {
        throw new BadRequestException(
          'El procesamiento de audio no está habilitado',
        );
      }

      // Validar el tamaño del audio
      const audioSizeMb = this.calculateBase64SizeMb(dto.audioData);
      if (audioSizeMb > this.maxAudioSizeMb) {
        throw new BadRequestException(
          `El archivo de audio excede el tamaño máximo permitido de ${this.maxAudioSizeMb}MB`,
        );
      }

      // Preparar la solicitud para el servidor en la nube
      const cloudRequest: CloudApiRequestDto = {
        audio: dto.audioData,
        transcript: dto.transcription,
        metadata: {
          customerId: dto.customerId,
          orderId: dto.orderId,
          timestamp: new Date().toISOString(),
        },
      };

      // Enviar al servidor en la nube
      const cloudResponse = await this.callCloudApi(cloudRequest);

      if (!cloudResponse.success) {
        return {
          success: false,
          message: 'No se pudo procesar el audio',
          error: cloudResponse.error || {
            code: 'PROCESSING_ERROR',
            message: 'Error desconocido al procesar el audio',
          },
        };
      }

      // Procesar la respuesta del servidor en la nube
      const result = await this.processCloudResponse(
        cloudResponse.data || cloudResponse,
      );

      return result;
    } catch (error) {
      this.logger.error('Error processing audio order:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error al procesar la orden de audio',
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Error interno del servidor',
        },
      };
    }
  }

  private async callCloudApi(
    request: CloudApiRequestDto,
  ): Promise<CloudApiResponseDto> {
    try {
      // Convertir base64 a Buffer
      const audioBuffer = Buffer.from(request.audio, 'base64');

      // Crear FormData
      const FormData = require('form-data');
      const formData = new FormData();

      // Agregar archivo de audio
      formData.append('audio', audioBuffer, {
        filename: `order_${Date.now()}.mp4`,
        contentType: 'audio/mp4',
      });

      // Agregar transcripción
      formData.append('transcription', request.transcript);

      const response = await firstValueFrom(
        this.httpService.post<any>(
          `${this.cloudApiUrl}/api/v1/audio/process-order`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'X-API-Key': this.cloudApiKey,
            },
            timeout: this.timeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error('Cloud API call failed:', axiosError.message);

      if (axiosError.response?.data) {
        return axiosError.response.data as CloudApiResponseDto;
      }

      return {
        success: false,
        error: {
          code: 'CLOUD_API_ERROR',
          message: 'Error al comunicarse con el servidor de procesamiento',
        },
      };
    }
  }

  private async processCloudResponse(
    data: any,
  ): Promise<AudioOrderResponseDto> {
    // El servidor en la nube devuelve directamente los datos estructurados
    // No hay una acción específica, solo los datos extraídos

    this.logger.log('=== DEBUG processCloudResponse ===');
    this.logger.log('Data from cloud:', JSON.stringify(data, null, 2));
    this.logger.log('orderType:', data.orderType);
    this.logger.log('=================================');

    return {
      success: true,
      message: 'Audio procesado exitosamente',
      extractedData: {
        orderItems: data.orderItems || [],
        deliveryInfo: data.deliveryInfo || {},
        scheduledDelivery: data.scheduledDelivery || {},
        orderType: data.orderType, // Agregando orderType aquí
        warnings: data.warnings,
        processingTime: data.processingTime,
      },
    };
  }

  private calculateBase64SizeMb(base64String: string): number {
    // Remover el prefijo data:audio/xxx;base64, si existe
    const base64Data = base64String.split(',')[1] || base64String;
    // Calcular el tamaño en bytes
    const sizeInBytes = (base64Data.length * 3) / 4;
    // Convertir a MB
    return sizeInBytes / (1024 * 1024);
  }

  async checkServiceHealth(): Promise<{
    status: string;
    available: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      // Verificar configuración local primero
      if (!this.isEnabled) {
        return {
          status: 'disabled',
          available: false,
          message: 'El servicio de procesamiento de audio está deshabilitado',
          timestamp: new Date().toISOString(),
        };
      }

      if (!this.cloudApiUrl || !this.cloudApiKey) {
        return {
          status: 'misconfigured',
          available: false,
          message: 'Configuración del servicio incompleta',
          timestamp: new Date().toISOString(),
        };
      }

      // Hacer ping al servicio remoto
      // Si cloudApiUrl ya incluye /api/v1/audio, entonces solo agregamos /health
      // Si no, agregamos la ruta completa
      const healthCheckUrl = this.cloudApiUrl.includes('/api/v1/audio')
        ? `${this.cloudApiUrl}/health`
        : `${this.cloudApiUrl}/api/v1/audio/health`;
      const response = await firstValueFrom(
        this.httpService.get(healthCheckUrl, {
          headers: {
            'X-API-Key': this.cloudApiKey,
          },
          timeout: 5000, // Timeout corto para health check
        }),
      );

      if (response.status === 200) {
        return {
          status: 'ok',
          available: true,
          message: 'Servicio de procesamiento de audio disponible',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'error',
        available: false,
        message: 'Servicio no responde correctamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error verificando salud del servicio:', error);

      let message = 'No se puede conectar con el servicio de procesamiento';
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED') {
          message = 'Servicio de procesamiento no disponible';
        } else if (error.code === 'ETIMEDOUT') {
          message = 'Tiempo de espera agotado al conectar con el servicio';
        }
      }

      return {
        status: 'error',
        available: false,
        message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
