import { authService } from '@/modules/auth/services/authService';
import { useAuthStore } from '@/app/store/authStore';
import EncryptedStorage from '@/app/services/secureStorageService';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

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
      await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
      await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
      await EncryptedStorage.removeItem(USER_INFO_KEY);
      
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
    console.error('Error verificando token:', error);
    return false;
  }
}