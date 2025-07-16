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

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
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
      console.error('Error retrieving secure item:', error);
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

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing secure item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    // expo-secure-store no tiene un método clear()
    // Necesitamos eliminar las claves conocidas manualmente
    const keysToRemove = [
      'access_token',
      'refresh_token',
      'user_data',
      'api_url',
      'kitchen_filter_screens',
      'theme_mode',
    ];

    for (const key of keysToRemove) {
      try {
        await this.removeItem(key);
      } catch (error) {
        console.error(`Error removing key ${key}:`, error);
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
