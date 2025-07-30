import { authService } from '@/modules/auth/services/authService';
import { useAuthStore } from '@/app/stores/authStore';
import { STORAGE_KEYS } from '@/app/constants/storageKeys';
import EncryptedStorage from '@/app/services/secureStorageService';

/**
 * Verifica si el token almacenado es válido con el backend
 * Esta función está separada para evitar ciclos de dependencias
 */
export async function verifyStoredToken(): Promise<boolean> {
  try {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      return false;
    }

    const isTokenValid = await authService.verifyToken();

    if (!isTokenValid) {
      // Si el token no es válido, limpiamos todo
      await EncryptedStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await EncryptedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await EncryptedStorage.removeItem(STORAGE_KEYS.USER_INFO);

      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });

      return false;
    }

    return true;
  } catch (error) {
    // Error verificando token
    return false;
  }
}
