import { registerAs } from '@nestjs/config';
import { AudioOrderConfig } from './audio-order-config.type';

export default registerAs<AudioOrderConfig>('audioOrder', () => {
  return {
    enabled: true, // Siempre habilitado si el módulo está cargado
    cloudApiUrl: process.env.CLOUD_API_URL || '',
    cloudApiKey: process.env.CLOUD_API_KEY || '',
    maxAudioSizeMb: 50, // Hasta 50MB para audio de 5 minutos
    supportedFormats: [
      'audio/webm',
      'audio/ogg',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
    ],
    timeout: 300000, // 5 minutos de timeout
  };
});
