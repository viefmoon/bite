import apiClient from '@/app/services/apiClient';

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
      const response = await apiClient.get<AppConfig>('/api/v1/app-config');
      this.config = response.data;
      return this.config;
    } catch (error) {
      return {
        maps: {
          apiKey: '',
        },
      };
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