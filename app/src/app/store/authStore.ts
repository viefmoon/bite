import { create } from 'zustand';
import EncryptedStorage from '@/app/services/secureStorageService';
import type { User } from '../schemas/domain/user.schema';
import * as ScreenOrientation from 'expo-screen-orientation';

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
      // Error al guardar access token
    }
  },

  setRefreshToken: async (refreshToken: string) => {
    try {
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      set({ refreshToken });
    } catch (error) {
      // Error al guardar refresh token
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
      // Error al guardar información del usuario
    }
  },

  logout: async () => {
    const ORIENTATION_DELAYS = {
      UNLOCK: 100,
      LOCK: 200,
    };

    const clearAuthData = async () => {
      await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
      await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
      await EncryptedStorage.removeItem(USER_INFO_KEY);
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    };

    try {
      await ScreenOrientation.unlockAsync();
      await new Promise((resolve) =>
        setTimeout(resolve, ORIENTATION_DELAYS.UNLOCK),
      );
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, ORIENTATION_DELAYS.LOCK),
      );
      await clearAuthData();
    } catch (error) {
      try {
        await clearAuthData();
      } catch (fallbackError) {
        // Silently handle critical error
      }
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

      // La verificación del token se hará de manera lazy cuando sea necesario
      // Esto evita el ciclo de dependencias con authService
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
