import { registerAs } from '@nestjs/config';
import { SyncConfig } from './sync-config.type';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsBoolean()
  SYNC_ENABLED: boolean;

  @IsString()
  @IsNotEmpty()
  CLOUD_API_URL: string;

  @IsString()
  @IsNotEmpty()
  CLOUD_API_KEY: string;

  @IsNumber()
  @Min(1)
  SYNC_INTERVAL_MINUTES: number;

  @IsBoolean()
  SYNC_WEBSOCKET_ENABLED: boolean;
}

export default registerAs<SyncConfig>('sync', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    enabled: process.env.SYNC_ENABLED === 'true',
    cloudApiUrl: process.env.CLOUD_API_URL || '',
    cloudApiKey: process.env.CLOUD_API_KEY || '',
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
    webSocketEnabled: process.env.SYNC_WEBSOCKET_ENABLED === 'true',
  };
});
