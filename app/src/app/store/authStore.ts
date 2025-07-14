import { create } from 'zustand';
import EncryptedStorage from 'react-native-encrypted-storage';
import type { User } from '../../modules/auth/schema/auth.schema'; // Corregida ruta de importación
import { authService } from '../../modules/auth/services/authService';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (
    accessToken: string,
    refreshToken: string,
    user: User | null,
  ) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  setRefreshToken: (refreshToken: string) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  setTokens: async (
    accessToken: string,
    refreshToken: string,
    user: User | null,
  ) => {
    // Verificar si el usuario está activo antes de guardar los tokens
    if (user && 'isActive' in user && !user.isActive) {
      throw new Error('Usuario inactivo');
    }

    await EncryptedStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) {
      await EncryptedStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    } else {
      await EncryptedStorage.removeItem(USER_INFO_KEY);
    }
    set({
      accessToken,
      refreshToken,
      user: user ?? null,
      isAuthenticated: true,
    });
  },

  setAccessToken: async (accessToken: string) => {
    try {
      await EncryptedStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      set({ accessToken, isAuthenticated: true });
    } catch (error) {
      console.error('[AuthStore] Error al guardar access token:', error);
    }
  },

  setRefreshToken: async (refreshToken: string) => {
    try {
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      set({ refreshToken });
    } catch (error) {
      console.error('[AuthStore] Error al guardar refresh token:', error);
    }
  },

  setUser: async (user: User | null) => {
    try {
      if (user) {
        // Si el usuario se actualiza y está inactivo, cerrar sesión
        if ('isActive' in user && !user.isActive) {
          await useAuthStore.getState().logout();
          return;
        }
        await EncryptedStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      } else {
        await EncryptedStorage.removeItem(USER_INFO_KEY);
      }
      set({ user });
    } catch (error) {
      console.error(
        '[AuthStore] Error al guardar información del usuario:',
        error,
      );
    }
  },

  logout: async () => {
    try {
      await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
      await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
      await EncryptedStorage.removeItem(USER_INFO_KEY);
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('[AuthStore] Error durante logout:', error);
    }
  },
}));

export const initializeAuthStore = async () => {
  try {
    const accessToken = await EncryptedStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    const userInfoString = await EncryptedStorage.getItem(USER_INFO_KEY);
    let user: User | null = null;
    if (userInfoString) {
      try {
        user = JSON.parse(userInfoString);
      } catch (parseError) {
        await EncryptedStorage.removeItem(USER_INFO_KEY);
      }
    }

    if (accessToken && refreshToken) {
      // Verificar si el usuario está activo antes de restaurar la sesión
      if (user && 'isActive' in user && !user.isActive) {
        await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
        await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
        await EncryptedStorage.removeItem(USER_INFO_KEY);
        useAuthStore.setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
        return;
      }

      // Primero establecemos el token en el estado para que el apiClient pueda usarlo
      useAuthStore.setState({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: true,
      });

      // Verificamos si el token es válido con el backend actual
      const isTokenValid = await authService.verifyToken();

      if (isTokenValid) {
        // Token is valid, authentication state is already set
      } else {
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
      }
    } else {
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  }
};
