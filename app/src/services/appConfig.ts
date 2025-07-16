import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';

export interface AppConfig {
  maps: {
    apiKey: string;
  };
}

class AppConfigService {
  private config: AppConfig | null = null;

  async getConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await apiClient.get<AppConfig>(API_PATHS.APP_CONFIG);
      this.config = response.data;
      return this.config;
    } catch (error) {
      const defaultConfig: AppConfig = {
        maps: {
          apiKey: '',
        },
      };
      this.config = defaultConfig;
      return defaultConfig;
    }
  }

  async getMapsApiKey(): Promise<string> {
    const config = await this.getConfig();
    return config.maps.apiKey;
  }

  // Limpiar caché si es necesario
  clearCache() {
    this.config = null;
  }
}

export const appConfigService = new AppConfigService();
