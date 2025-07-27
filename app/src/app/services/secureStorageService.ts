import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Servicio de almacenamiento seguro usando expo-secure-store
 * Reemplaza a react-native-encrypted-storage
 */
class SecureStorageService {
  private isAvailable(): boolean {
    // SecureStore no está disponible en web
    return Platform.OS !== 'web';
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.isAvailable()) {
      // Fallback para web: usar localStorage (no seguro)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }

    await SecureStore.setItemAsync(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      // Fallback para web
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isAvailable()) {
      // Fallback para web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }

    await SecureStore.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    // expo-secure-store no tiene un método clear()
    // Necesitamos eliminar las claves conocidas manualmente
    const keysToRemove = [
      'auth_token',
      'refresh_token',
      'user_info',
      'last_known_api_url',
      'kitchen_filters_preferences',
      'app_theme_preference',
      'user_credentials',
      'remember_me_preference',
      'connection_mode',
      'manual_server_url',
    ];

    for (const key of keysToRemove) {
      try {
        await this.removeItem(key);
      } catch (error) {
        // Silently ignore removal errors
      }
    }
  }
}

// Exportar una instancia única para mantener compatibilidad con EncryptedStorage
const secureStorage = new SecureStorageService();

// Exportar con el mismo nombre que EncryptedStorage para facilitar la migración
export default {
  setItem: (key: string, value: string) => secureStorage.setItem(key, value),
  getItem: (key: string) => secureStorage.getItem(key),
  removeItem: (key: string) => secureStorage.removeItem(key),
  clear: () => secureStorage.clear(),
};

// También exportar la clase por si se necesita
export { SecureStorageService };
